/* Copyright (C) 2023 Wildfire Games.
 * This file is part of 0 A.D.
 *
 * 0 A.D. is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * 0 A.D. is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with 0 A.D.  If not, see <http://www.gnu.org/licenses/>.
 */

#include "precompiled.h"

#include "simulation2/system/Component.h"
#include "ICmpProjectileManager.h"

#include "ICmpAttack.h"
#include "ICmpObstruction.h"
#include "ICmpObstructionManager.h"
#include "ICmpPosition.h"
#include "ICmpRangeManager.h"
#include "ICmpTerrain.h"
#include "simulation2/helpers/Los.h"
#include "simulation2/MessageTypes.h"

#include "graphics/Model.h"
#include "graphics/Unit.h"
#include "graphics/UnitManager.h"
#include "maths/Frustum.h"
#include "maths/Matrix3D.h"
#include "maths/Quaternion.h"
#include "maths/Vector3D.h"
#include "ps/CLogger.h"
#include "renderer/Scene.h"
#include "scriptinterface/FunctionWrapper.h"

// Time (in seconds) before projectiles that stuck in the ground are destroyed
const static float PROJECTILE_DECAY_TIME = 30.f;

class CCmpProjectileManager final : public ICmpProjectileManager
{
public:
	static void ClassInit(CComponentManager& componentManager)
	{
		componentManager.SubscribeToMessageType(MT_Interpolate);
		componentManager.SubscribeToMessageType(MT_RenderSubmit);
		componentManager.SubscribeToMessageType(MT_TurnStart);
		componentManager.SubscribeToMessageType(MT_Update_Final);
	}

	DEFAULT_COMPONENT_ALLOCATOR(ProjectileManager)

	static std::string GetSchema()
	{
		return "<a:component type='system'/><empty/>";
	}

	void Init(const CParamNode& UNUSED(paramNode)) override
	{
		m_ActorSeed = 0;
		m_NextId = 1;
		JS_AddExtraGCRootsTracer(GetSimContext().GetScriptInterface().GetGeneralJSContext(), Trace, (void*)this);
	}

	void Deinit() override
	{
		for (size_t i = 0; i < m_Projectiles.size(); ++i)
			GetSimContext().GetUnitManager().DeleteUnit(m_Projectiles[i].unit);
		m_Projectiles.clear();
		JS_RemoveExtraGCRootsTracer(GetSimContext().GetScriptInterface().GetGeneralJSContext(), Trace, (void*)this);
	}

	void Serialize(ISerializer& serialize) override
	{
		// Because this is just graphical effects, and because it's all non-deterministic floating point,
		// we don't do much serialization here.
		// (That means projectiles will vanish if you save/load - is that okay?)

		// The attack code stores the id so that the projectile gets deleted when it hits the target
		serialize.NumberU32_Unbounded("next id", m_NextId);
	}

	void Deserialize(const CParamNode& paramNode, IDeserializer& deserialize) override
	{
		Init(paramNode);

		// The attack code stores the id so that the projectile gets deleted when it hits the target
		deserialize.NumberU32_Unbounded("next id", m_NextId);
	}

	void HandleMessage(const CMessage& msg, bool UNUSED(global)) override
	{
		switch (msg.GetType())
		{
		case MT_Interpolate:
		{
			const CMessageInterpolate& msgData = static_cast<const CMessageInterpolate&> (msg);
			Interpolate(msgData.deltaSimTime);
			break;
		}
		case MT_RenderSubmit:
		{
			const CMessageRenderSubmit& msgData = static_cast<const CMessageRenderSubmit&> (msg);
			RenderSubmit(msgData.collector, msgData.frustum, msgData.culling);
			break;
		}
		case MT_TurnStart:
		{
			for (size_t i = 0; i < m_Projectiles.size(); ++i)
			{
				Projectile& projectile = m_Projectiles[i];
				projectile.graphicalLateness = -1.f;
			}
			ScriptRequest rq(GetSimContext().GetScriptInterface());
			for (PendingEffect& effect: m_PendingEffects)
			{
				CmpPtr<ICmpAttack> cmpAttack(GetSimContext(), effect.ent);
				if (cmpAttack)
					cmpAttack->ProjectileHit(JS::HandleValue::fromMarkedLocation(effect.data.unsafeGet()), effect.delay);
			}
			m_PendingEffects.clear();
			break;
		}
		case MT_Update_Final:
		{
			const CMessageUpdate_Final& msgData = static_cast<const CMessageUpdate_Final&>(msg);
			m_PercentIntoTurn = 0.f;
			m_TurnLength = msgData.turnLength.ToFloat();

			for (size_t i = 0; i < m_Projectiles.size(); ++i)
			{
				Projectile& projectile = m_Projectiles[i];
				UpdateProjectile(projectile, msgData.turnLength);
			}
			break;
		}
		}
	}

	uint32_t LaunchProjectileAtPoint(JS::HandleValue data, const CFixedVector3D& launchPoint, const CFixedVector3D& target, entity_id_t targetEnt, fixed lateness, fixed speed, fixed gravity, const std::wstring& actorName, const std::wstring& impactActorName, fixed impactAnimationLifetime) override
	{
		return LaunchProjectile(data, launchPoint, target, targetEnt, lateness, speed, gravity, actorName, impactActorName, impactAnimationLifetime);
	}

	void RemoveProjectile(uint32_t) override;

	void RenderModel(CModelAbstract& model, const CVector3D& position, SceneCollector& collector, const CFrustum& frustum, bool culling,
		const CLosQuerier& los, bool losRevealAll) const;

	/**
	 * Called during GC tracing of our components.
	 */
	static void Trace(JSTracer* trc, void* data)
	{
		CCmpProjectileManager& cmp = *(static_cast<CCmpProjectileManager*>(data));
		for (Projectile& proj: cmp.m_Projectiles)
			JS::TraceEdge(trc, &proj.data, "CCmpProjectileManager::Trace");
		for (PendingEffect& effect: cmp.m_PendingEffects)
			JS::TraceEdge(trc, &effect.data, "CCmpProjectileManager::Trace");
	}

private:
	struct Projectile
	{
		CUnit* unit;
		CFixedVector3D lastPos;
		CFixedVector3D pos;
		CFixedVector3D v;
		entity_id_t targetEnt;
		fixed timeToHit;
		fixed gravity;

		fixed lateness;
		float graphicalLateness;
		float impactAnimationLifetime;
		uint32_t id;
		std::wstring impactActorName;
		bool isImpactAnimationCreated;
		bool stopped;
		bool willHit = false;

		JS::Heap<JS::Value> data;

		CFixedVector3D advancePosition(fixed t) const
		{
			CFixedVector3D ret(pos);
			ret.X += v.X.Multiply(t);
			ret.Z += v.Z.Multiply(t);
			ret.Y += v.Y.Multiply(t);
			return ret;
		}
	};

	struct ProjectileImpactAnimation
	{
		CUnit* unit;
		CVector3D pos;
		float time;
	};

	struct PendingEffect
	{
		entity_id_t ent;
		fixed delay;
		JS::Heap<JS::Value> data;

		PendingEffect(entity_id_t ent, fixed delay, JS::Heap<JS::Value>&& data)
			: ent(ent), delay(delay), data(data)
		{}
	};

	std::vector<Projectile> m_Projectiles;

	std::vector<ProjectileImpactAnimation> m_ProjectileImpactAnimations;

	std::vector<PendingEffect> m_PendingEffects;

	uint32_t m_ActorSeed;

	uint32_t m_NextId;

	float m_PercentIntoTurn = 0.0f;
	float m_TurnLength = 0.0f;

	uint32_t LaunchProjectile(JS::HandleValue data, CFixedVector3D launchPoint, CFixedVector3D targetPoint, entity_id_t targetEnt, fixed lateness, fixed speed, fixed gravity,
		const std::wstring& actorName, const std::wstring& impactActorName, fixed impactAnimationLifetime);

	void UpdateProjectile(Projectile& projectile, fixed dt);

	bool AdvanceProjectile(const Projectile& projectile, float dt) const;

	void Interpolate(float frameTime);

	void RenderSubmit(SceneCollector& collector, const CFrustum& frustum, bool culling) const;
};

REGISTER_COMPONENT_TYPE(ProjectileManager)

uint32_t CCmpProjectileManager::LaunchProjectile(JS::HandleValue data, CFixedVector3D launchPoint, CFixedVector3D targetPoint, entity_id_t targetEnt, fixed lateness, fixed speed, fixed gravity, const std::wstring& actorName, const std::wstring& impactActorName, fixed impactAnimationLifetime)
{
	// This is network synced so don't use GUI checks before incrementing or it breaks any non GUI simulations
	uint32_t currentId = m_NextId++;

	if (!GetSimContext().HasUnitManager() || actorName.empty())
		return currentId; // do nothing if graphics are disabled

	Projectile projectile;
	projectile.id = currentId;
	projectile.stopped = false;
	projectile.gravity = gravity;
	projectile.isImpactAnimationCreated = false;

	ScriptRequest rq(GetSimContext().GetScriptInterface());
	projectile.data.set(data);

	if (!impactActorName.empty())
	{
		projectile.impactActorName = impactActorName;
		projectile.impactAnimationLifetime = impactAnimationLifetime.ToFloat();
	}
	else
	{
		projectile.impactActorName = L"";
		projectile.impactAnimationLifetime = 0.f;
	}

	projectile.unit = GetSimContext().GetUnitManager().CreateUnit(actorName, INVALID_ENTITY, m_ActorSeed++);
	if (!projectile.unit) // The error will have already been logged
		return currentId;

	projectile.targetEnt = targetEnt;

	projectile.pos = launchPoint;
	projectile.lastPos = launchPoint;
	CFixedVector3D offset(targetPoint);
	offset -= projectile.pos;
	fixed horizDistance = offset.Length();
	projectile.timeToHit = horizDistance.MulDiv(fixed::FromInt(1), speed);
	projectile.v = offset.MulDiv(fixed::FromInt(1), projectile.timeToHit);

	// Account for gravity in the vertical direction
	projectile.v.Y += gravity.MulDiv(projectile.timeToHit, fixed::FromInt(2));

	if (lateness > fixed::Zero())
	{
		projectile.lateness = (fixed::FromInt(200) - lateness)/1000;
	}
	else
		projectile.lateness = fixed::FromInt(200)/1000;
	projectile.graphicalLateness = projectile.lateness.ToFloat();

	m_Projectiles.push_back(projectile);

	return projectile.id;
}

void CCmpProjectileManager::UpdateProjectile(Projectile& projectile, fixed dt) {
	dt -= projectile.lateness;
	projectile.lateness = fixed::Zero();
	projectile.timeToHit -= dt;

	projectile.lastPos = projectile.pos;

	// Lower by half before moving to lower the imprecision.
	projectile.v.Y -= projectile.gravity.Multiply(dt / 2);
	projectile.pos = projectile.advancePosition(dt);
	projectile.v.Y -= projectile.gravity.Multiply(dt / 2);

	CFixedVector3D delta = projectile.pos - projectile.lastPos;

	// Detect potential collisions.
	if (projectile.willHit)
		return;

	ICmpObstructionManager::ObstructionSquare square;
	square.x = projectile.pos.X + delta.X / 2;
	square.z = projectile.pos.Z + delta.Z / 2;
	square.u = CFixedVector2D(delta.X, delta.Z);
	square.u.Normalize();
	square.v = CFixedVector2D(-delta.Z, delta.X);
	square.v.Normalize();
	square.hw = delta.X / 2;
	square.hh = delta.Z / 2;

	CmpPtr<ICmpObstructionManager> cmpObstructionManager(GetSystemEntity());
	cmpObstructionManager->HandleCollisionWith(square, NullObstructionFilter(), [this, &projectile](entity_id_t ent) {
		if (ent == projectile.targetEnt) {
			// Don't remove the projectile right away, do it when interpolating graphics.
			projectile.willHit = true;
			// Store the effect for the beginning of next turn (otherwise units die "too early", visually).
			// TODO store delay (from time to hit?)
			m_PendingEffects.emplace_back(ent, fixed::Zero(), std::move(projectile.data));
			return true;
		}
		return false;
	});
	// Check if we'll hit the ground, update our time to hit.
	// TODO: this can skip hits if we're going "through" terrain.
	CmpPtr<ICmpTerrain> cmpTerrain(GetSystemEntity());
	if (cmpTerrain)
	{
		entity_pos_t h = cmpTerrain->GetGroundLevel(projectile.pos.X, projectile.pos.Z);
		if (projectile.pos.Y < h)
		{
			// Interpolate the time to hit
			projectile.timeToHit = projectile.timeToHit + (projectile.pos.Y - h).MulDiv(dt, delta.Y);
			projectile.v.X = fixed::Zero();
			projectile.v.Y = fixed::Zero();
			projectile.v.Z = fixed::Zero();
		}
	}
}

bool CCmpProjectileManager::AdvanceProjectile(const Projectile& projectile, float percentIntoTurn) const
{
	if (projectile.stopped)
		return false;

	CVector3D delta = CVector3D(projectile.pos) - CVector3D(projectile.lastPos);
	CVector3D currentPos = CVector3D(projectile.lastPos) + delta * percentIntoTurn;

	bool hit_ground = false;

	// If we'll hit the gorund, we need to stop interpolating the position.
	CmpPtr<ICmpTerrain> cmpTerrain(GetSystemEntity());
	if (cmpTerrain)
	{
		float h = cmpTerrain->GetExactGroundLevel(currentPos.X, currentPos.Z);
		if (currentPos.Y < h)
		{
			hit_ground = true;
		}
	}

	// Construct a rotation matrix so that (0,1,0) is in the direction of 'delta'

	CVector3D up(0, 1, 0);

	delta.Normalize();
	CVector3D axis = up.Cross(delta);
	if (axis.LengthSquared() < 0.0001f)
		axis = CVector3D(1, 0, 0); // if up & delta are almost collinear, rotate around some other arbitrary axis
	else
		axis.Normalize();

	float angle = acosf(up.Dot(delta));

	CMatrix3D transform;
	CQuaternion quat;
	quat.FromAxisAngle(axis, angle);
	quat.ToMatrix(transform);

	// Then apply the translation
	transform.Translate(currentPos);

	// Move the model
	projectile.unit->GetModel().SetTransform(transform);

	return hit_ground;
}

void CCmpProjectileManager::Interpolate(float frameTime)
{
	m_PercentIntoTurn += frameTime / m_TurnLength;
	for (size_t i = 0; i < m_Projectiles.size(); ++i)
	{
		float percentIntoTurn = m_PercentIntoTurn;
		if (m_Projectiles[i].graphicalLateness > 0.f && m_TurnLength - m_Projectiles[i].graphicalLateness > 0.01f) // Coarse enough
			percentIntoTurn = std::max(0.f, m_PercentIntoTurn * m_TurnLength - m_Projectiles[i].graphicalLateness) / (m_TurnLength - m_Projectiles[i].graphicalLateness);
		if (AdvanceProjectile(m_Projectiles[i], percentIntoTurn))
			m_Projectiles[i].stopped = true;
		else if (m_Projectiles[i].willHit && m_Projectiles[i].timeToHit.ToFloat() < (m_PercentIntoTurn-1.f)*m_TurnLength)
			m_Projectiles[i].stopped = true;
	}

	// Remove the ones that have reached their target
	for (size_t i = 0; i < m_Projectiles.size(); )
	{
		if (!m_Projectiles[i].stopped)
		{
			++i;
			continue;
		}

		if (!m_Projectiles[i].impactActorName.empty() && !m_Projectiles[i].isImpactAnimationCreated)
		{
			CVector3D pos = m_Projectiles[i].unit->GetModel().GetTransform().GetTranslation();
			m_Projectiles[i].isImpactAnimationCreated = true;
			CMatrix3D transform;
			CQuaternion quat;
			quat.ToMatrix(transform);
			transform.Translate(pos);

			CUnit* unit = GetSimContext().GetUnitManager().CreateUnit(m_Projectiles[i].impactActorName, INVALID_ENTITY, m_ActorSeed++);
			unit->GetModel().SetTransform(transform);

			ProjectileImpactAnimation projectileImpactAnimation;
			projectileImpactAnimation.unit = unit;
			projectileImpactAnimation.time = m_Projectiles[i].impactAnimationLifetime;
			projectileImpactAnimation.pos = pos;
			m_ProjectileImpactAnimations.push_back(projectileImpactAnimation);
		}

		// Projectiles hitting targets get removed immediately.
		// Those hitting the ground stay for a while, because it looks pretty.
		if (m_Projectiles[i].willHit || m_Projectiles[i].timeToHit.ToFloat() < -PROJECTILE_DECAY_TIME)
		{
			// Delete in-place by swapping with the last in the list
			std::swap(m_Projectiles[i], m_Projectiles.back());
			GetSimContext().GetUnitManager().DeleteUnit(m_Projectiles.back().unit);
			m_Projectiles.pop_back();
			continue;
		}
		++i;
	}

	for (size_t i = 0; i < m_ProjectileImpactAnimations.size();)
	{
		if (m_ProjectileImpactAnimations[i].time > 0)
		{
			m_ProjectileImpactAnimations[i].time -= frameTime;
			++i;
		}
		else
		{
			std::swap(m_ProjectileImpactAnimations[i], m_ProjectileImpactAnimations.back());
			GetSimContext().GetUnitManager().DeleteUnit(m_ProjectileImpactAnimations.back().unit);
			m_ProjectileImpactAnimations.pop_back();
		}
	}
}

void CCmpProjectileManager::RemoveProjectile(uint32_t id)
{
	// Scan through the projectile list looking for one with the correct id to remove
	for (size_t i = 0; i < m_Projectiles.size(); i++)
	{
		if (m_Projectiles[i].id == id)
		{
			// Delete in-place by swapping with the last in the list
			std::swap(m_Projectiles[i], m_Projectiles.back());
			GetSimContext().GetUnitManager().DeleteUnit(m_Projectiles.back().unit);
			m_Projectiles.pop_back();
			return;
		}
	}
}

void CCmpProjectileManager::RenderModel(CModelAbstract& model, const CVector3D& position, SceneCollector& collector,
	const CFrustum& frustum, bool culling, const CLosQuerier& los, bool losRevealAll) const
{
	// Don't display objects outside the visible area
	ssize_t posi = (ssize_t)(0.5f + position.X / LOS_TILE_SIZE);
	ssize_t posj = (ssize_t)(0.5f + position.Z / LOS_TILE_SIZE);
	if (!losRevealAll && !los.IsVisible(posi, posj))
		return;

	model.ValidatePosition();

	if (culling && !frustum.IsBoxVisible(model.GetWorldBoundsRec()))
		return;

	// TODO: do something about LOS (copy from CCmpVisualActor)

	collector.SubmitRecursive(&model);
}

void CCmpProjectileManager::RenderSubmit(SceneCollector& collector, const CFrustum& frustum, bool culling) const
{
	CmpPtr<ICmpRangeManager> cmpRangeManager(GetSystemEntity());
	int player = GetSimContext().GetCurrentDisplayedPlayer();
	CLosQuerier los(cmpRangeManager->GetLosQuerier(player));
	bool losRevealAll = cmpRangeManager->GetLosRevealAll(player);

	for (const Projectile& projectile : m_Projectiles)
	{
		if (m_PercentIntoTurn * m_TurnLength < projectile.graphicalLateness)
			continue;
		RenderModel(projectile.unit->GetModel(), projectile.pos, collector, frustum, culling, los, losRevealAll);
	}

	for (const ProjectileImpactAnimation& projectileImpactAnimation : m_ProjectileImpactAnimations)
	{
		RenderModel(projectileImpactAnimation.unit->GetModel(), projectileImpactAnimation.pos,
			collector, frustum, culling, los, losRevealAll);
	}
}
