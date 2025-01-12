function Guard() {}

Guard.prototype.Schema =
	"<empty/>";

Guard.prototype.Init = function()
{
	this.entities = [];
};

/** @param {EntityId} entity */
Guard.prototype.GetRange = function(entity)
{
	let range = 8;
	let cmpFootprint = Engine.QueryInterface(entity, IID_Footprint);
	if (cmpFootprint)
	{
		let shape = cmpFootprint.GetShape();
		if (shape.type == "square")
			range += Math.sqrt(shape.depth*shape.depth + shape.width*shape.width)*2/3;
		else if (shape.type == "circle")
			range += shape.radius*3/2;
	}
	return range;
};

Guard.prototype.GetEntities = function()
{
	return this.entities.slice();
};

/** @param {EntityId[]} entities */
Guard.prototype.SetEntities = function(entities)
{
	this.entities = entities;
};

/** @param {EntityId} ent */
Guard.prototype.AddGuard = function(ent)
{
	if (this.entities.indexOf(ent) != -1)
		return;
	this.entities.push(ent);
};

/** @param {EntityId} ent */
Guard.prototype.RemoveGuard = function(ent)
{
	let index = this.entities.indexOf(ent);
	if (index != -1)
		this.entities.splice(index, 1);
};

/**
 * @param {EntityId} oldent
 * @param {EntityId} newent
 */
Guard.prototype.RenameGuard = function(oldent, newent)
{
	let index = this.entities.indexOf(oldent);
	if (index != -1)
		this.entities[index] = newent;
};

/** @param {MessageAttacked} msg */
Guard.prototype.OnAttacked = function(msg)
{
	for (let ent of this.entities)
		Engine.PostMessage(ent, MT_GuardedAttacked, { "guarded": this.entity, "data": msg });
};

/**
 * If an entity is captured, or about to be killed (so its owner
 * changes to '-1') or if diplomacy changed, update the guards list
 */
/** @param {MessageOwnershipChanged} msg */
Guard.prototype.OnOwnershipChanged = function(msg)
{
	if (!this.entities.length)
		return;
	this.CheckGuards(msg.to == INVALID_PLAYER);
};

/** @param {MessageDiplomacyChanged} msg */
Guard.prototype.OnDiplomacyChanged = function(msg)
{
	if (!this.entities.length)
		return;
	this.CheckGuards();
};

Guard.prototype.CheckGuards = function(force = false)
{
	let entities = this.GetEntities();
	for (let ent of entities)
	{
		if (force || !IsOwnedByMutualAllyOfEntity(this.entity, ent))
		{
			let cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI);
			if (cmpUnitAI && cmpUnitAI.IsGuardOf() && cmpUnitAI.IsGuardOf() == this.entity)
				cmpUnitAI.RemoveGuard();
			else
				this.RemoveGuard(ent);
		}
	}
};

Engine.RegisterComponentType(IID_Guard, "Guard", Guard);
