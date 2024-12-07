/* Copyright (C) 2024 Wildfire Games.
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

#include "graphics/Terrain.h"
#include "graphics/TextureManager.h"
#include "graphics/ShaderManager.h"
#include "graphics/ShaderProgram.h"
#include "lib/bits.h"
#include "lib/timer.h"
#include "maths/MathUtil.h"
#include "maths/Vector2D.h"
#include "ps/CLogger.h"
#include "ps/CStrInternStatic.h"
#include "ps/Game.h"
#include "ps/World.h"
#include "renderer/backend/IDevice.h"
#include "renderer/PostprocManager.h"
#include "renderer/Renderer.h"
#include "renderer/RenderingOptions.h"
#include "renderer/SceneRenderer.h"
#include "renderer/WaterManager.h"
#include "simulation2/Simulation2.h"
#include "simulation2/components/ICmpWaterManager.h"
#include "simulation2/components/ICmpRangeManager.h"

#include <algorithm>
#include <unordered_set>

constexpr u16 MAX_WAVE_WIDTH = 7; // Maximal horizontal spread of waves
constexpr u16 WAVE_DEPTH = 1; // Number of vertices depth-wise (for now we don't really need more than 1)

struct CoastalPoint
{
	CoastalPoint(int idx, CVector2D pos) : index(idx), position(pos) {};
	int index;
	CVector2D position;
};

struct SWavesVertex
{
	CVector3D m_Position;
	float m_UV[2];
};
cassert(sizeof(SWavesVertex) == 20);

struct WaveObject
{
	CVertexBufferManager::Handle m_VBVertices;
	CBoundingBoxAligned m_AABB;
	size_t m_Width;
	float m_TimeDiff;
};

WaterManager::WaterManager(Renderer::Backend::IDevice* device)
	: m_Device(device)
{
	// water
	m_RenderWater = false; // disabled until textures are successfully loaded
	m_WaterHeight = 5.0f;

	m_RefTextureSize = 0;

	m_WaterTexTimer = 0.0;

	m_WindAngle = 0.0f;
	m_Waviness = 8.0f;
	m_WaterColor = CColor(0.3f, 0.35f, 0.7f, 1.0f);
	m_WaterTint = CColor(0.28f, 0.3f, 0.59f, 1.0f);
	m_Murkiness = 0.45f;
	m_RepeatPeriod = 16.0f;

	m_WaterEffects = true;
	m_WaterFancyEffects = false;
	m_WaterRealDepth = false;
	m_WaterRefraction = false;
	m_WaterReflection = false;
	m_WaterType = L"ocean";

	m_NeedsReloading = false;
	m_NeedInfoUpdate = true;

	m_MapSize = 0;

	m_updatei0 = 0;
	m_updatej0 = 0;
	m_updatei1 = 0;
	m_updatej1 = 0;
}

WaterManager::~WaterManager()
{
	// Cleanup if the caller messed up
	UnloadWaterTextures();

	m_ShoreWaves.clear();
	m_ShoreWavesVBIndices.Reset();

	m_DistanceHeightmap.reset();
	m_WindStrength.reset();

	m_FancyEffectsFramebuffer.reset();
	m_FancyEffectsOccludersFramebuffer.reset();
	m_RefractionFramebuffer.reset();
	m_ReflectionFramebuffer.reset();

	m_FancyTexture.reset();
	m_FancyTextureDepth.reset();
	m_ReflFboDepthTexture.reset();
	m_RefrFboDepthTexture.reset();
}

void WaterManager::Initialize()
{
	const uint32_t stride = sizeof(SWavesVertex);

	const std::array<Renderer::Backend::SVertexAttributeFormat, 2> attributes{{
		{Renderer::Backend::VertexAttributeStream::POSITION,
			Renderer::Backend::Format::R32G32B32_SFLOAT,
			offsetof(SWavesVertex, m_Position), stride,
			Renderer::Backend::VertexAttributeRate::PER_VERTEX, 0},
		{Renderer::Backend::VertexAttributeStream::UV0,
			Renderer::Backend::Format::R32G32_SFLOAT,
			offsetof(SWavesVertex, m_UV), stride,
			Renderer::Backend::VertexAttributeRate::PER_VERTEX, 0},
	}};
	m_ShoreVertexInputLayout = g_Renderer.GetVertexInputLayout(attributes);
}

///////////////////////////////////////////////////////////////////
// Progressive load of water textures
int WaterManager::LoadWaterTextures()
{
	// TODO: this doesn't need to be progressive-loading any more
	// (since texture loading is async now)

	wchar_t pathname[PATH_MAX];

	// Load diffuse grayscale images (for non-fancy water)
	for (size_t i = 0; i < ARRAY_SIZE(m_WaterTexture); ++i)
	{
		swprintf_s(pathname, ARRAY_SIZE(pathname), L"art/textures/animated/water/default/diffuse%02d.dds", (int)i+1);
		CTextureProperties textureProps(pathname);
		textureProps.SetAddressMode(
			Renderer::Backend::Sampler::AddressMode::REPEAT);

		CTexturePtr texture = g_Renderer.GetTextureManager().CreateTexture(textureProps);
		texture->Prefetch();
		m_WaterTexture[i] = texture;
	}

	m_RenderWater = true;

	// Load normalmaps (for fancy water)
	ReloadWaterNormalTextures();

	// Load CoastalWaves
	{
		CTextureProperties textureProps(L"art/textures/terrain/types/water/coastalWave.png");
		textureProps.SetAddressMode(
			Renderer::Backend::Sampler::AddressMode::REPEAT);
		CTexturePtr texture = g_Renderer.GetTextureManager().CreateTexture(textureProps);
		texture->Prefetch();
		m_WaveTex = texture;
	}

	// Load Foam
	{
		CTextureProperties textureProps(L"art/textures/terrain/types/water/foam.png");
		textureProps.SetAddressMode(
			Renderer::Backend::Sampler::AddressMode::REPEAT);
		CTexturePtr texture = g_Renderer.GetTextureManager().CreateTexture(textureProps);
		texture->Prefetch();
		m_FoamTex = texture;
	}

	RecreateOrLoadTexturesIfNeeded();

	return 0;
}

void WaterManager::RecreateOrLoadTexturesIfNeeded()
{
	// Use screen-sized textures for minimum artifacts.
	const size_t newRefTextureSize = round_up_to_pow2(g_Renderer.GetHeight());

	if (m_RefTextureSize != newRefTextureSize)
	{
		m_ReflectionFramebuffer.reset();
		m_ReflectionTexture.reset();
		m_ReflFboDepthTexture.reset();

		m_RefractionFramebuffer.reset();
		m_RefractionTexture.reset();
		m_RefrFboDepthTexture.reset();

		m_RefTextureSize = newRefTextureSize;
	}

	const Renderer::Backend::Format depthFormat =
		m_Device->GetPreferredDepthStencilFormat(
			Renderer::Backend::ITexture::Usage::SAMPLED |
				Renderer::Backend::ITexture::Usage::DEPTH_STENCIL_ATTACHMENT,
			true, false);

	// Create reflection textures.
	const bool needsReflectionTextures =
		g_RenderingOptions.GetWaterEffects() &&
		g_RenderingOptions.GetWaterReflection();
	if (needsReflectionTextures && !m_ReflectionTexture)
	{
		m_ReflectionTexture = m_Device->CreateTexture2D("WaterReflectionTexture",
			Renderer::Backend::ITexture::Usage::SAMPLED |
				Renderer::Backend::ITexture::Usage::COLOR_ATTACHMENT,
			Renderer::Backend::Format::R8G8B8A8_UNORM, m_RefTextureSize, m_RefTextureSize,
			Renderer::Backend::Sampler::MakeDefaultSampler(
				Renderer::Backend::Sampler::Filter::LINEAR,
				Renderer::Backend::Sampler::AddressMode::MIRRORED_REPEAT));

		m_ReflFboDepthTexture = m_Device->CreateTexture2D("WaterReflectionDepthTexture",
			Renderer::Backend::ITexture::Usage::SAMPLED |
				Renderer::Backend::ITexture::Usage::DEPTH_STENCIL_ATTACHMENT,
			depthFormat, m_RefTextureSize, m_RefTextureSize,
			Renderer::Backend::Sampler::MakeDefaultSampler(
				Renderer::Backend::Sampler::Filter::NEAREST,
				Renderer::Backend::Sampler::AddressMode::REPEAT));

		Renderer::Backend::SColorAttachment colorAttachment{};
		colorAttachment.texture = m_ReflectionTexture.get();
		colorAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::CLEAR;
		colorAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::STORE;
		colorAttachment.clearColor = CColor{0.5f, 0.5f, 1.0f, 0.0f};

		Renderer::Backend::SDepthStencilAttachment depthStencilAttachment{};
		depthStencilAttachment.texture = m_ReflFboDepthTexture.get();
		depthStencilAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::CLEAR;
		depthStencilAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::STORE;

		m_ReflectionFramebuffer = m_Device->CreateFramebuffer("ReflectionFramebuffer",
			&colorAttachment, &depthStencilAttachment);
		if (!m_ReflectionFramebuffer)
		{
			g_RenderingOptions.SetWaterReflection(false);
			UpdateQuality();
		}
	}

	// Create refraction textures.
	const bool needsRefractionTextures =
		g_RenderingOptions.GetWaterEffects() &&
		g_RenderingOptions.GetWaterRefraction();
	if (needsRefractionTextures && !m_RefractionTexture)
	{
		m_RefractionTexture = m_Device->CreateTexture2D("WaterRefractionTexture",
			Renderer::Backend::ITexture::Usage::SAMPLED |
				Renderer::Backend::ITexture::Usage::COLOR_ATTACHMENT,
			Renderer::Backend::Format::R8G8B8A8_UNORM, m_RefTextureSize, m_RefTextureSize,
			Renderer::Backend::Sampler::MakeDefaultSampler(
				Renderer::Backend::Sampler::Filter::LINEAR,
				Renderer::Backend::Sampler::AddressMode::MIRRORED_REPEAT));

		m_RefrFboDepthTexture = m_Device->CreateTexture2D("WaterRefractionDepthTexture",
			Renderer::Backend::ITexture::Usage::SAMPLED |
				Renderer::Backend::ITexture::Usage::DEPTH_STENCIL_ATTACHMENT,
			depthFormat, m_RefTextureSize, m_RefTextureSize,
			Renderer::Backend::Sampler::MakeDefaultSampler(
				Renderer::Backend::Sampler::Filter::NEAREST,
				Renderer::Backend::Sampler::AddressMode::REPEAT));

		Renderer::Backend::SColorAttachment colorAttachment{};
		colorAttachment.texture = m_RefractionTexture.get();
		colorAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::CLEAR;
		colorAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::STORE;
		colorAttachment.clearColor = CColor{1.0f, 0.0f, 0.0f, 0.0f};

		Renderer::Backend::SDepthStencilAttachment depthStencilAttachment{};
		depthStencilAttachment.texture = m_RefrFboDepthTexture.get();
		depthStencilAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::CLEAR;
		depthStencilAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::STORE;

		m_RefractionFramebuffer = m_Device->CreateFramebuffer("RefractionFramebuffer",
			&colorAttachment, &depthStencilAttachment);
		if (!m_RefractionFramebuffer)
		{
			g_RenderingOptions.SetWaterRefraction(false);
			UpdateQuality();
		}
	}

	const float scale{g_Renderer.GetPostprocManager().IsEnabled()
		? g_Renderer.GetPostprocManager().GetScale() : 1.0f};
	const uint32_t newWidth{static_cast<uint32_t>(g_Renderer.GetWidth() * scale)};
	const uint32_t newHeight{static_cast<uint32_t>(g_Renderer.GetHeight() * scale)};
	if (m_FancyTexture && (m_FancyTexture->GetWidth() != newWidth || m_FancyTexture->GetHeight() != newHeight))
	{
		m_FancyEffectsFramebuffer.reset();
		m_FancyEffectsOccludersFramebuffer.reset();
		m_FancyTexture.reset();
		m_FancyTextureDepth.reset();
	}

	// Create the Fancy Effects textures.
	const bool needsFancyTextures =
		g_RenderingOptions.GetWaterEffects() &&
		g_RenderingOptions.GetWaterFancyEffects();
	if (needsFancyTextures && !m_FancyTexture)
	{
		m_FancyTexture = m_Device->CreateTexture2D("WaterFancyTexture",
			Renderer::Backend::ITexture::Usage::SAMPLED |
				Renderer::Backend::ITexture::Usage::COLOR_ATTACHMENT,
			Renderer::Backend::Format::R8G8B8A8_UNORM, newWidth, newHeight,
			Renderer::Backend::Sampler::MakeDefaultSampler(
				Renderer::Backend::Sampler::Filter::LINEAR,
				Renderer::Backend::Sampler::AddressMode::REPEAT));

		m_FancyTextureDepth = m_Device->CreateTexture2D("WaterFancyDepthTexture",
			Renderer::Backend::ITexture::Usage::DEPTH_STENCIL_ATTACHMENT,
			depthFormat, newWidth, newHeight,
			Renderer::Backend::Sampler::MakeDefaultSampler(
				Renderer::Backend::Sampler::Filter::LINEAR,
				Renderer::Backend::Sampler::AddressMode::REPEAT));

		Renderer::Backend::SColorAttachment colorAttachment{};
		colorAttachment.texture = m_FancyTexture.get();
		colorAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::CLEAR;
		colorAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::STORE;
		colorAttachment.clearColor = CColor{0.0f, 0.0f, 0.0f, 0.0f};

		Renderer::Backend::SDepthStencilAttachment depthStencilAttachment{};
		depthStencilAttachment.texture = m_FancyTextureDepth.get();
		depthStencilAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::CLEAR;
		// We need to store depth for later rendering occluders.
		depthStencilAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::STORE;

		m_FancyEffectsFramebuffer = m_Device->CreateFramebuffer("FancyEffectsFramebuffer",
			&colorAttachment, &depthStencilAttachment);

		Renderer::Backend::SColorAttachment occludersColorAttachment{};
		occludersColorAttachment.texture = m_FancyTexture.get();
		occludersColorAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::LOAD;
		occludersColorAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::STORE;
		occludersColorAttachment.clearColor = CColor{0.0f, 0.0f, 0.0f, 0.0f};

		Renderer::Backend::SDepthStencilAttachment occludersDepthStencilAttachment{};
		occludersDepthStencilAttachment.texture = m_FancyTextureDepth.get();
		occludersDepthStencilAttachment.loadOp = Renderer::Backend::AttachmentLoadOp::LOAD;
		occludersDepthStencilAttachment.storeOp = Renderer::Backend::AttachmentStoreOp::DONT_CARE;

		m_FancyEffectsOccludersFramebuffer = m_Device->CreateFramebuffer("FancyEffectsOccludersFramebuffer",
			&occludersColorAttachment, &occludersDepthStencilAttachment);
		if (!m_FancyEffectsFramebuffer || !m_FancyEffectsOccludersFramebuffer)
		{
			g_RenderingOptions.SetWaterRefraction(false);
			UpdateQuality();
		}
	}
}

void WaterManager::ReloadWaterNormalTextures()
{
	wchar_t pathname[PATH_MAX];
	for (size_t i = 0; i < ARRAY_SIZE(m_NormalMap); ++i)
	{
		swprintf_s(pathname, ARRAY_SIZE(pathname), L"art/textures/animated/water/%ls/normal00%02d.png", m_WaterType.c_str(), static_cast<int>(i) + 1);
		CTextureProperties textureProps(pathname);
		textureProps.SetAddressMode(
			Renderer::Backend::Sampler::AddressMode::REPEAT);
		textureProps.SetAnisotropicFilter(true);

		CTexturePtr texture = g_Renderer.GetTextureManager().CreateTexture(textureProps);
		texture->Prefetch();
		m_NormalMap[i] = texture;
	}
}

///////////////////////////////////////////////////////////////////
// Unload water textures
void WaterManager::UnloadWaterTextures()
{
	for (size_t i = 0; i < ARRAY_SIZE(m_WaterTexture); i++)
		m_WaterTexture[i].reset();

	for (size_t i = 0; i < ARRAY_SIZE(m_NormalMap); i++)
		m_NormalMap[i].reset();

	m_RefractionFramebuffer.reset();
	m_ReflectionFramebuffer.reset();
	m_ReflectionTexture.reset();
	m_RefractionTexture.reset();
}

std::unique_ptr<float[]>
ComputeDistances(const int SideSize, float waterHeight, const u16* heightmap, float maxDistance) {
#define ABOVEWATER(x, z) (HEIGHT_SCALE * heightmap[z * SideSize + x] >= waterHeight)

    std::unique_ptr<float[]> distances = std::make_unique<float[]>(SideSize * SideSize);
    std::fill(distances.get(), distances.get() + SideSize * SideSize, maxDistance + 10.0f);

    struct Cell {
        int x, y;
        float distance;
        bool operator>(const Cell& other) const { return distance > other.distance; }
    };

    std::priority_queue<Cell, std::vector<Cell>, std::greater<>> pq;

    auto isShoreline = [&](int x, int y) {
        if (!ABOVEWATER(x, y)) return 0; // Not ocean
        for (int d = 0; d < 4; ++d) {
            int nx = x + (d == 0) - (d == 1);
            int ny = y + (d == 2) - (d == 3);
            if (nx >= 0 && ny >= 0 && nx < SideSize && ny < SideSize && !ABOVEWATER(nx, ny))
                return heightmap[ny * SideSize + nx] - heightmap[y * SideSize + x];
        }
        return 0;
    };

    for (int y = 0; y < SideSize; ++y) {
        for (int x = 0; x < SideSize; ++x) {
			u16 heightDelta = isShoreline(x, y);
            if (heightDelta) {
				// Interpolate our actual distance based on the height delta (gives slightly better results in general)
				float dist = HEIGHT_SCALE * heightDelta;
				if (dist > 1.0f) {
					dist = 0.5f;
				}
                pq.push({x, y, dist/2.0f});
                distances[y * SideSize + x] = dist/2.0f;
            }
        }
    }

    std::vector<int> dx = {-1, 1, 0, 0, -1, -1, 1, 1};
    std::vector<int> dy = {0, 0, -1, 1, -1, 1, -1, 1};
    std::vector<float> weights = {1.0f, 1.0f, 1.0f, 1.0f, std::sqrt(2.0f), std::sqrt(2.0f), std::sqrt(2.0f), std::sqrt(2.0f)};

    while (!pq.empty()) {
        auto [x, y, dist] = pq.top();
        pq.pop();

        if (dist > distances[y * SideSize + x]) continue;

        for (int d = 0; d < 8; ++d) {
            int nx = x + dx[d], ny = y + dy[d];
            float newDist = dist + weights[d];

            if (nx >= 0 && ny >= 0 && nx < SideSize && ny < SideSize && newDist < distances[ny * SideSize + nx] && newDist <= maxDistance) {
                distances[ny * SideSize + nx] = newDist;
                pq.push({nx, ny, newDist});
            }
        }
    }

	// Correct tiles onland to be negative
	for (int y = 0; y < SideSize; ++y) {
		for (int x = 0; x < SideSize; ++x) {
			if (ABOVEWATER(x, y)) {
				distances[y * SideSize + x] = -distances[y * SideSize + x];
			}
		}
	}

	// Blur the distance map a bit, which helps avoid any jaggedness
	float blurRadius = 3.0;
    float sigma = blurRadius / 2.0f;
    int kernelSize = blurRadius * 2 + 1;

	std::vector<float> kernel(kernelSize);

    for (int i = -blurRadius; i <= blurRadius; ++i) {
        kernel[i + blurRadius] = std::exp(-0.5f * (i * i) / (sigma * sigma));
    }

    float kernelSum = std::accumulate(kernel.begin(), kernel.end(), 0.0f);
    for (auto& k : kernel) k /= kernelSum;

	auto blurHeightmap = [&](auto& input, auto& output, bool horizontal) {
        for (int y = 0; y < SideSize; ++y) {
            for (int x = 0; x < SideSize; ++x) {
                float sum = 0.0f;

                for (int k = -blurRadius; k <= blurRadius; ++k) {
                    int nx = horizontal ? x + k : x;
                    int ny = horizontal ? y : y + k;

                    if (nx >= 0 && ny >= 0 && nx < SideSize && ny < SideSize) {
                        auto g = input[ny * SideSize + nx];
                        float weight = kernel[k + blurRadius];
                        sum += g * weight;
                    }
                }

                output[y * SideSize + x] = sum;
            }
        }
    };

	std::unique_ptr<float[]> blurredDistances = std::make_unique<float[]>(SideSize * SideSize);
	blurHeightmap(distances, blurredDistances, true);
	blurHeightmap(blurredDistances, distances, false);

	return distances;
#undef ABOVEWATER
}

///////////////////////////////////////////////////////////////////
// Calculate our binary heightmap from the terrain heightmap.
void WaterManager::RecomputeDistanceHeightmap()
{
	const CTerrain& terrain = g_Game->GetWorld()->GetTerrain();
	if (!terrain.GetHeightMap())
		return;

	int SideSize = static_cast<int>(m_MapSize);

	// We don't really care about distance above this and it's better to stop for performance.
	const size_t maxDistance = 10;
	m_DistanceHeightmap = ComputeDistances(SideSize, m_WaterHeight, terrain.GetHeightMap(), maxDistance);
}

void WaterManager::CreateWaveMeshes()
{
	if (m_MapSize == 0)
		return;

	const CTerrain& terrain = g_Game->GetWorld()->GetTerrain();
	const u16* heightmap = terrain.GetHeightMap();
	if (!heightmap)
		return;

	m_ShoreWaves.clear();
	m_ShoreWavesVBIndices.Reset();

	// Generate waves for ocean or for lakes with waviness > 4.0f
	if (!(m_WaterType == L"ocean" || (m_WaterType == L"lake" && m_Waviness > 4.0f)))
		return;

	u16 SideSize = m_MapSize;

	constexpr int aroundSq[4][2] = { { -1,0 }, { 0,1 }, { 1,0 }, { 0,-1 } };
	constexpr int aroundDiag[4][2] = { { -1,-1 }, { -1,1 }, { 1,1 }, { 1,-1 } };

	// First step: get the points near the coast.
	std::unordered_set<u32> CoastalPointsSet;
	for (u16 z = 1; z < SideSize-1; ++z)
		for (u16 x = 1; x < SideSize-1; ++x)
		{
			// It gives better results to use the heightmap over the distance map here.
			if (heightmap[z*SideSize + x] * HEIGHT_SCALE > m_WaterHeight)
				continue;
			for (int i = 0; i < 4; ++i)
				if (heightmap[(z + aroundSq[i][1])*SideSize + x + aroundSq[i][0]] * HEIGHT_SCALE > m_WaterHeight)
				{
					CoastalPointsSet.insert(x + z*SideSize);
					break;
				}
		}

	// Second step: create chains out of those coastal points.
	std::vector<std::deque<CoastalPoint>> CoastalPointsChains;
	CoastalPointsChains.reserve(16);
	// We'll reuse the same deque as a buffer.
	std::deque<CoastalPoint> Chain;
	while (!CoastalPointsSet.empty())
	{
		int index = *(CoastalPointsSet.begin());
		int x = index % SideSize;
		int y = (index - x ) / SideSize;

		Chain.clear();

		Chain.push_front(CoastalPoint(index, CVector2D(x*4,y*4)));
		CoastalPointsSet.erase(CoastalPointsSet.begin());

		// At the starting point, find our two neighbors (hopefully).
		// We'll follow the path down both direction until we can no longer find neighbors.
		// (Here we know we're not at a boundary so no need to check).
		int neighbours[2] = { -1, -1 };
		int nbNeighb = 0;
		for (int i = 0; i < 4; ++i)
			if (CoastalPointsSet.count(x + aroundSq[i][0] + (y + aroundSq[i][1])*SideSize))
			{
				if (nbNeighb < 2)
					neighbours[nbNeighb++] = x + aroundSq[i][0] + (y + aroundSq[i][1])*SideSize;
				else {
					++nbNeighb;
					break;
				}
			}
		// Try diagonally if we failed to find any otherwise.
		if (nbNeighb == 0) {
			nbNeighb = 0;
			for (int i = 0; i < 4; ++i)
				if (CoastalPointsSet.count(x + aroundDiag[i][0] + (y + aroundDiag[i][1])*SideSize))
				{
					if (nbNeighb < 2)
						neighbours[nbNeighb++] = x + aroundDiag[i][0] + (y + aroundDiag[i][1])*SideSize;
					else {
						++nbNeighb;
						break;
					}
				}

		}
		// In irregular cases, we can have more than two neighbors.
		// We'll just assume those points aren't suitable for coastal waves.
		if (nbNeighb == 0 || nbNeighb > 2) {
			continue;
		}

		// Go down both ends, appending to our chain.
		for (int i = 0; i < 2; ++i)
		{
			if (neighbours[i] == -1)
				continue;

			// Move to our neighboring point
			int xx = neighbours[i] % SideSize;
			int yy = (neighbours[i] - xx ) / SideSize;
			int indexx = xx + yy*SideSize;
			CoastalPointsSet.erase(indexx);

			if (i == 0)
				Chain.push_back(CoastalPoint(indexx,CVector2D(xx*4,yy*4)));
			else
				Chain.push_front(CoastalPoint(indexx,CVector2D(xx*4,yy*4)));

			while (true)
			{
				// If we're at a boundary, we won't find more points
				if (xx == 0 || xx == SideSize-1 || yy == 0 || yy == SideSize-1)
					break;

				nbNeighb = 0;
				// Remember the latest point we found.
				int xxx = xx;
				int yyy = yy;
				// At this point we expect only one neighbor.
				for (int p = 0; p < 4; ++p)
					if (CoastalPointsSet.count(xx+aroundSq[p][0] + (yy + aroundSq[p][1])*SideSize))
					{
						if (++nbNeighb > 1)
							break;
						xxx = xx + aroundSq[p][0];
						yyy = yy + aroundSq[p][1];
					}
				if (nbNeighb == 0)
					for (int p = 0; p < 4; ++p)
						if (CoastalPointsSet.count(xx+aroundDiag[p][0] + (yy + aroundDiag[p][1])*SideSize))
						{
							if (++nbNeighb > 1)
								break;
							xxx = xx + aroundDiag[p][0];
							yyy = yy + aroundDiag[p][1];
						}
				if (nbNeighb != 1)
					break;
				// We've found a valid point in the chain
				// Move there
				xx = xxx;
				yy = yyy;
				indexx = xx + yy*SideSize;
				if (i == 0)
					Chain.push_back(CoastalPoint(indexx,CVector2D(xx*4,yy*4)));
				else
					Chain.push_front(CoastalPoint(indexx,CVector2D(xx*4,yy*4)));
				CoastalPointsSet.erase(xx + yy*SideSize);
			}
		}
		// Only keep chains that are large enough to be interesting.
		if (Chain.size() > 4) {
			CoastalPointsChains.push_back(Chain);
		}
	}

	// (optional) third step: Smooth chains out.
	constexpr int smoothness_level = 2;
	for (size_t i = 0; i < CoastalPointsChains.size(); ++i)
		for (int p = 0; p < smoothness_level; ++p)
			for (size_t j = 1; j < CoastalPointsChains[i].size()-1; ++j)
			{
				CVector2D realPos = CoastalPointsChains[i][j-1].position + CoastalPointsChains[i][j+1].position;

				CoastalPointsChains[i][j].position = (CoastalPointsChains[i][j].position + realPos/2.0f)/2.0f;
			}

	// Fourth and final step: create waves themselves, creating subchains.

	// Construct indices buffer (we reuse the same for all waves)
	std::vector<u16> water_indices;
	for (u16 a = 0; a < MAX_WAVE_WIDTH; ++a)
		for (u16 depth = 0; depth < WAVE_DEPTH; ++depth)
		{
			water_indices.push_back(a * (WAVE_DEPTH+1) + depth);
			water_indices.push_back((a+1) * (WAVE_DEPTH+1) + depth);
			water_indices.push_back(a * (WAVE_DEPTH+1) + 1 + depth);

			water_indices.push_back((a+1) * (WAVE_DEPTH+1) + depth);
			water_indices.push_back((a+1) * (WAVE_DEPTH+1) + 1 + depth);
			water_indices.push_back(a * (WAVE_DEPTH+1) + 1 + depth);
		}

	m_ShoreWavesVBIndices = g_Renderer.GetVertexBufferManager().AllocateChunk(
		sizeof(u16), water_indices.size(),
		Renderer::Backend::IBuffer::Type::INDEX,
		Renderer::Backend::IBuffer::Usage::TRANSFER_DST,
		nullptr, CVertexBufferManager::Group::WATER);
	m_ShoreWavesVBIndices->m_Owner->UpdateChunkVertices(m_ShoreWavesVBIndices.Get(), &water_indices[0]);

	std::vector<SWavesVertex> vertices, reversed;
	for (size_t i = 0; i < CoastalPointsChains.size(); ++i)
	{
		float diff = (rand() % 50) / 5.0f;
		bool sign = false;
		for (size_t start = 0; start < CoastalPointsChains[i].size(); start += 5) {
			u16 width = std::min(MAX_WAVE_WIDTH, static_cast<u16>(CoastalPointsChains[i].size() - start - 1));

			if (width < 3)
				continue;
			
			std::unique_ptr<WaveObject> shoreWave = std::make_unique<WaveObject>();
			vertices.clear();
			vertices.reserve(WAVE_DEPTH * width);

			shoreWave->m_Width = width;
			shoreWave->m_TimeDiff = diff;
			diff += rand() % 20 / 20.0f + 2.0;

			CVector2D lastPerp, perp;
			bool accept = true;

			// First pass to determine if we're reverse order
			// (this applies to the whole chain)
			if (!sign)
				for (size_t j = start; j <= start + width; ++j)
				{
					CVector2D pos = CoastalPointsChains[i][j].position;
					
					// Get the perpendicular vector
					if (j == 0)
						perp = CoastalPointsChains[i][j+1].position - pos;
					else if (j == width)
						perp = pos - CoastalPointsChains[i][j-1].position;
					else {
						perp = CoastalPointsChains[i][j+1].position - CoastalPointsChains[i][j].position;
					}
					// now rotate it 90 degrees
					perp = CVector2D(-perp.Y, perp.X);
					perp.Normalize();

					if (!sign && terrain.GetExactGroundLevel(pos.X+perp.X*2.5f, pos.Y+perp.Y*2.5f)
						> m_WaterHeight) {
						sign = true;
						break;
					}
				}

			for (size_t j = start; j <= start + width; ++j)
			{
				CVector2D pos = CoastalPointsChains[i][j].position;

				lastPerp = perp;
				// Get the perpendicular vector
				if (j == 0)
					perp = CoastalPointsChains[i][j+1].position - pos;
				else if (j == width)
					perp = pos - CoastalPointsChains[i][j-1].position;
				else {
					perp = CoastalPointsChains[i][j+1].position - pos;
				}

				// now rotate it 90 degrees
				perp = CVector2D(-perp.Y, perp.X);
				perp.Normalize();

				if (sign)
					perp = -perp;

				if (j > start+1 && lastPerp.Dot(perp) < 0.8f)
				{
					//LOGWARNING("Wave chain %d is too sharp at point %d - %f (%f, %f) (%f, %f)", i, j, lastPerp.Dot(perp), lastPerp.X, lastPerp.Y, perp.X, perp.Y);
					accept = false;
					start = j;
					break;
				}

				SWavesVertex point[WAVE_DEPTH+1];
				for (size_t depth = 0; depth <= WAVE_DEPTH; ++depth)
				{
					point[depth].m_UV[0] = (j-start) / static_cast<float>(width);
					point[depth].m_UV[1] = depth / static_cast<float>(WAVE_DEPTH);
					point[depth].m_Position = CVector3D(
					    pos.X+perp.X * (depth * 30.0f - 2.0f),
					    m_WaterHeight,
					    pos.Y+perp.Y * (depth * 30.0f - 2.0f)
					);

					vertices.push_back(point[depth]);

					shoreWave->m_AABB += point[depth].m_Position;
				}
			}
			if (!accept)
				continue;

			if (sign)
			{
				// Reverse the vertices to invert their index order
				reversed.clear();
				reversed.reserve(vertices.size());
				for (size_t j = width; j != static_cast<size_t>(-1); --j)
					for (size_t depth = 0; depth <= WAVE_DEPTH; ++depth)
						reversed.push_back(vertices[j * (WAVE_DEPTH+1) + depth]);
				std::swap(vertices, reversed);
			}
			shoreWave->m_VBVertices = g_Renderer.GetVertexBufferManager().AllocateChunk(sizeof(SWavesVertex), vertices.size(),
				Renderer::Backend::IBuffer::Type::VERTEX, Renderer::Backend::IBuffer::Usage::TRANSFER_DST, nullptr, CVertexBufferManager::Group::WATER);
			shoreWave->m_VBVertices->m_Owner->UpdateChunkVertices(shoreWave->m_VBVertices.Get(), &vertices[0]);

			m_ShoreWaves.emplace_back(std::move(shoreWave));
		}
	}
}

void WaterManager::RenderWaves(
	Renderer::Backend::IDeviceCommandContext* deviceCommandContext,
	const CFrustum& frustrum)
{
	if (!m_WaterFancyEffects)
		return;

	m_WaveTex->UploadBackendTextureIfNeeded(deviceCommandContext);
	m_FoamTex->UploadBackendTextureIfNeeded(deviceCommandContext);

	GPU_SCOPED_LABEL(deviceCommandContext, "Render Waves");

	Renderer::Backend::IFramebuffer* framebuffer =
		m_FancyEffectsFramebuffer.get();
	deviceCommandContext->BeginFramebufferPass(framebuffer);
	Renderer::Backend::IDeviceCommandContext::Rect viewportRect{};
	viewportRect.width = framebuffer->GetWidth();
	viewportRect.height = framebuffer->GetHeight();
	deviceCommandContext->SetViewports(1, &viewportRect);

	CShaderTechniquePtr tech = g_Renderer.GetShaderManager().LoadEffect(str_water_waves);
	deviceCommandContext->SetGraphicsPipelineState(
		tech->GetGraphicsPipelineState());
	deviceCommandContext->BeginPass();
	Renderer::Backend::IShaderProgram* shader = tech->GetShader();

	deviceCommandContext->SetTexture(
		shader->GetBindingSlot(str_waveTex), m_WaveTex->GetBackendTexture());
	deviceCommandContext->SetTexture(
		shader->GetBindingSlot(str_foamTex), m_FoamTex->GetBackendTexture());

	deviceCommandContext->SetUniform(
		shader->GetBindingSlot(str_time), static_cast<float>(m_WaterTexTimer));
	const CMatrix3D transform =
		g_Renderer.GetSceneRenderer().GetViewCamera().GetViewProjection();
	deviceCommandContext->SetUniform(
		shader->GetBindingSlot(str_transform), transform.AsFloatArray());

	for (size_t a = 0; a < m_ShoreWaves.size(); ++a)
	{
		if (!frustrum.IsBoxVisible(m_ShoreWaves[a]->m_AABB))
			continue;

		CVertexBuffer::VBChunk* VBchunk = m_ShoreWaves[a]->m_VBVertices.Get();
		ENSURE(!VBchunk->m_Owner->GetBuffer()->IsDynamic());
		ENSURE(!m_ShoreWavesVBIndices->m_Owner->GetBuffer()->IsDynamic());

		const size_t stride = sizeof(SWavesVertex);
		const uint32_t firstVertexOffset = static_cast<uint32_t>(VBchunk->m_Index * stride);

		deviceCommandContext->SetVertexInputLayout(m_ShoreVertexInputLayout);

		deviceCommandContext->SetUniform(
			shader->GetBindingSlot(str_translation), m_ShoreWaves[a]->m_TimeDiff);
		deviceCommandContext->SetUniform(
			shader->GetBindingSlot(str_width), static_cast<float>(m_ShoreWaves[a]->m_Width));

		deviceCommandContext->SetVertexBuffer(
			0, VBchunk->m_Owner->GetBuffer(), firstVertexOffset);
		deviceCommandContext->SetIndexBuffer(m_ShoreWavesVBIndices->m_Owner->GetBuffer());

		const uint32_t indexCount = static_cast<uint32_t>(m_ShoreWaves[a]->m_Width * WAVE_DEPTH * 6);
		deviceCommandContext->DrawIndexed(static_cast<uint32_t>(m_ShoreWavesVBIndices->m_Index), indexCount, 0);

		g_Renderer.GetStats().m_DrawCalls++;
		g_Renderer.GetStats().m_WaterTris += indexCount / 3;
	}
	deviceCommandContext->EndPass();
	deviceCommandContext->EndFramebufferPass();
}

void WaterManager::RecomputeWaterData()
{
	if (!m_MapSize)
		return;

	RecomputeDistanceHeightmap();
	RecomputeWindStrength();
	CreateWaveMeshes();
}

///////////////////////////////////////////////////////////////////
// Calculate the strength of the wind at a given point on the map.
void WaterManager::RecomputeWindStrength()
{
	if (m_MapSize <= 0)
		return;

	if (!m_WindStrength)
		m_WindStrength = std::make_unique<float[]>(m_MapSize * m_MapSize);

	const CTerrain& terrain = g_Game->GetWorld()->GetTerrain();
	if (!terrain.GetHeightMap())
		return;

	// Use a subsampled map
	u16 windSize = m_MapSize / 2;
	auto windMap = std::make_unique<float[]>(windSize * windSize);

	CVector2D windDir = CVector2D(cos(m_WindAngle), sin(m_WindAngle));

	int stepSize = 10;
	ssize_t windX = -round(stepSize * windDir.X);
	ssize_t windY = -round(stepSize * windDir.Y);

	struct SWindPoint {
		SWindPoint(size_t x, size_t y, float strength) : X(x), Y(y), windStrength(strength) {}
		ssize_t X;
		ssize_t Y;
		float windStrength;
	};

	std::vector<SWindPoint> startingPoints;
	std::vector<std::pair<int, int>> movement; // Every increment, move each starting point by all of these.

	// Compute starting points (one or two edges of the map) and how much to move each computation increment.
	if (fabs(windDir.X) < 0.01f)
	{
		movement.emplace_back(0, windY > 0.f ? 1 : -1);
		startingPoints.reserve(windSize);
		size_t start = windY > 0 ? 0 : windSize - 1;
		for (size_t x = 0; x < windSize; ++x)
			startingPoints.emplace_back(x, start, 0.f);
	}
	else if (fabs(windDir.Y) < 0.01f)
	{
		movement.emplace_back(windX > 0.f ? 1 : - 1, 0);
		startingPoints.reserve(windSize);
		size_t start = windX > 0 ? 0 : windSize - 1;
		for (size_t z = 0; z < windSize; ++z)
			startingPoints.emplace_back(start, z, 0.f);
	}
	else
	{
		startingPoints.reserve(windSize * 2);
		// Points along X.
		size_t start = windY > 0 ? 0 : windSize - 1;
		for (size_t x = 0; x < windSize; ++x)
			startingPoints.emplace_back(x, start, 0.f);
		// Points along Z, avoid repeating the corner point.
		start = windX > 0 ? 0 : windSize - 1;
		if (windY > 0)
			for (size_t z = 1; z < windSize; ++z)
				startingPoints.emplace_back(start, z, 0.f);
		else
			for (size_t z = 0; z < windSize-1; ++z)
				startingPoints.emplace_back(start, z, 0.f);

		// Compute movement array.
		movement.reserve(std::max(std::abs(windX),std::abs(windY)));
		while (windX != 0 || windY != 0)
		{
			std::pair<ssize_t, ssize_t> move = {
				windX == 0 ? 0 : windX > 0 ? +1 : -1,
				windY == 0 ? 0 : windY > 0 ? +1 : -1
			};
			windX -= move.first;
			windY -= move.second;
			movement.push_back(move);
		}
	}

	// We have all starting points ready, move them all until the map is covered.
	for (SWindPoint& point : startingPoints)
	{
		// Starting velocity is 1.0 unless in shallow water.
		windMap[point.Y * windSize + point.X] = 1.f;
		const float depth = m_WaterHeight - terrain.GetVertexGroundLevel(point.X*2, point.Y*2);
		if (depth > 0.f && depth < 2.f)
			windMap[point.Y * windSize + point.X] = depth / 2.f;
		point.windStrength = windMap[point.Y * windSize + point.X];

		bool onMap = true;
		while (onMap)
			for (size_t step = 0; step < movement.size(); ++step)
			{
				// Move wind speed towards the mean.
				point.windStrength = 0.3f + point.windStrength * 0.7f;

				// Adjust speed based on height difference, a positive height difference slowly increases speed (simulate venturi effect)
				// and a lower height reduces speed (wind protection from hills/...)
				const float heightDiff = std::max(m_WaterHeight, terrain.GetVertexGroundLevel(
					(point.X + movement[step].first)*2, (point.Y + movement[step].second)*2)) -
					std::max(m_WaterHeight, terrain.GetVertexGroundLevel(point.X*2, point.Y*2));
				if (heightDiff > 0.f)
					point.windStrength = std::min(2.f, point.windStrength + std::min(4.f, heightDiff) / 40.f);
				else
					point.windStrength = std::max(0.f, point.windStrength + std::max(-4.f, heightDiff) / 5.f);

				point.X += movement[step].first;
				point.Y += movement[step].second;

				if (point.X < 0 || point.X >= static_cast<ssize_t>(windSize) || point.Y < 0 || point.Y >= static_cast<ssize_t>(windSize))
				{
					onMap = false;
					break;
				}
				windMap[point.Y * windSize + point.X] = point.windStrength;
			}
	}
	
	// Blur the downsampled windMap
	auto blurDownsampled = [windSize](std::unique_ptr<float[]>& windMap) {
		auto temp = std::make_unique<float[]>(windSize * windSize);
		for (size_t y = 0; y < windSize; ++y) {
			for (size_t x = 0; x < windSize; ++x) {
				float sum = 0.f;
				float weightSum = 0.f;

				for (int ky = -1; ky <= 1; ++ky) {
					for (int kx = -1; kx <= 1; ++kx) {
						ssize_t nx = x + kx;
						ssize_t ny = y + ky;
						if (nx >= 0 && nx < static_cast<ssize_t>(windSize) && ny >= 0 && ny < static_cast<ssize_t>(windSize)) {
							float weight = (kx == 0 && ky == 0) ? 4.f : 1.f; // Center weight higher
							sum += windMap[ny * windSize + nx] * weight;
							weightSum += weight;
						}
					}
				}

				temp[y * windSize + x] = sum / weightSum;
			}
		}

		windMap.swap(temp); // Swap the pointers
	};

	blurDownsampled(windMap);

	// Upsample with bilinear interpolation
	auto upsampledBlur = [windSize, this](float* windMap) {
		for (size_t y = 0; y < m_MapSize; ++y) {
			for (size_t x = 0; x < m_MapSize; ++x) {
				float fx = static_cast<float>(x) * (windSize - 1) / (m_MapSize - 1);
				float fy = static_cast<float>(y) * (windSize - 1) / (m_MapSize - 1);

				int x1 = static_cast<int>(fx);
				int y1 = static_cast<int>(fy);
				int x2 = std::min(x1 + 1, static_cast<int>(windSize - 1));
				int y2 = std::min(y1 + 1, static_cast<int>(windSize - 1));

				float tx = fx - x1;
				float ty = fy - y1;

				// Bilinear interpolation
				float val = (1 - tx) * (1 - ty) * windMap[y1 * windSize + x1]
						+ tx * (1 - ty) * windMap[y1 * windSize + x2]
						+ (1 - tx) * ty * windMap[y2 * windSize + x1]
						+ tx * ty * windMap[y2 * windSize + x2];

				m_WindStrength[y * m_MapSize + x] = val;
			}
		}
	};
	upsampledBlur(windMap.get());
}

////////////////////////////////////////////////////////////////////////
// TODO: This will always recalculate for now
void WaterManager::SetMapSize(size_t size)
{
	// TODO: Im' blindly trusting the user here.
	m_MapSize = size;
	m_NeedInfoUpdate = true;
	m_updatei0 = 0;
	m_updatei1 = static_cast<u32>(size);
	m_updatej0 = 0;
	m_updatej1 = static_cast<u32>(size);

	m_DistanceHeightmap.reset();
	m_WindStrength.reset();
}

////////////////////////////////////////////////////////////////////////
// This will set the bools properly
void WaterManager::UpdateQuality()
{
	if (g_RenderingOptions.GetWaterEffects() != m_WaterEffects)
	{
		m_WaterEffects = g_RenderingOptions.GetWaterEffects();
		m_NeedsReloading = true;
	}
	if (g_RenderingOptions.GetWaterFancyEffects() != m_WaterFancyEffects)
	{
		m_WaterFancyEffects = g_RenderingOptions.GetWaterFancyEffects();
		m_NeedsReloading = true;
	}
	if (g_RenderingOptions.GetWaterRealDepth() != m_WaterRealDepth)
	{
		m_WaterRealDepth = g_RenderingOptions.GetWaterRealDepth();
		m_NeedsReloading = true;
	}
	if (g_RenderingOptions.GetWaterRefraction() != m_WaterRefraction)
	{
		m_WaterRefraction = g_RenderingOptions.GetWaterRefraction();
		m_NeedsReloading = true;
	}
	if (g_RenderingOptions.GetWaterReflection() != m_WaterReflection)
	{
		m_WaterReflection = g_RenderingOptions.GetWaterReflection();
		m_NeedsReloading = true;
	}
}

bool WaterManager::WillRenderFancyWater() const
{
	return
		m_RenderWater && m_Device->GetBackend() != Renderer::Backend::Backend::GL_ARB &&
		g_RenderingOptions.GetWaterEffects();
}

size_t WaterManager::GetCurrentTextureIndex(const double& period) const
{
	ENSURE(period > 0.0);
	return static_cast<size_t>(m_WaterTexTimer * ARRAY_SIZE(m_WaterTexture) / period) % ARRAY_SIZE(m_WaterTexture);
}

size_t WaterManager::GetNextTextureIndex(const double& period) const
{
	ENSURE(period > 0.0);
	return (GetCurrentTextureIndex(period) + 1) % ARRAY_SIZE(m_WaterTexture);
}
