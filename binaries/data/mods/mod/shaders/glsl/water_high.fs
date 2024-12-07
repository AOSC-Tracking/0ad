#version 110

#include "water_high.h"

#include "common/debug_fragment.h"
#include "common/fog.h"
#include "common/fragment.h"
#include "common/los_fragment.h"
#include "common/shadows_fragment.h"

// These control the scaling of the water normal map at high and low waviness.
float bigScale = waveParams1.r;
float smallScale = waveParams1.g;
// This controls how much the normal map moves over time.
float speedMultiplier = waveParams1.b;
// This is the minimal amount of waviness that is applied to the water.
float baseNormalMix = waveParams1.a;
// This is added to the waviness factor, up until normals are fully in effect.
float maxNormalMixAt = waveParams2.r;
// This is used for the parallax mapping.
float parallaxHeightScale = waveParams2.g;
// How much base foam along the shore
float shoreFoam = waveParams2.b;

float getHeightAt(vec2 texCoords) {
	float ww1 = SAMPLE_2D(GET_DRAW_TEXTURE_2D(normalMap), texCoords).a;
	float ww2 = SAMPLE_2D(GET_DRAW_TEXTURE_2D(normalMap2), texCoords).a;
	float wwInterp = mix(ww1, ww2, moddedTime);

	// This isn't correct because we're sampling the unmodified point,
	// but it still helps selling the effect.
	wwInterp += SAMPLE_2D(GET_DRAW_TEXTURE_2D(waterEffectsTex), gl_FragCoord.xy / screenSize).g;

	return wwInterp;
}

const float minSteps = 4.0;
const float maxSteps = 40.0;

vec2 parallaxMapping(float heightScale, vec2 texCoords, vec3 viewDir) {
	// Transpose into left-hand tangent space
	vec3 rayDir = vec3(
		viewDir.x * windCosSin.x + viewDir.z * -windCosSin.y,
		viewDir.x * windCosSin.y + viewDir.z * windCosSin.x,
		viewDir.y
	);
	
	vec2 currentTexCoords = texCoords + rayDir.xy * 0.5 * heightScale / rayDir.z;

	// This requires quite a few steps to look good as the heightscale is large.
	float numSteps = mix(maxSteps, minSteps, abs(dot(vec3(0.0, 0.0, 1.0), rayDir)));
	numSteps /= v_eyeDistance / 100.0;
	numSteps = clamp(numSteps, minSteps, maxSteps);
	float stepSize = 1.0 / numSteps;

	float currentDepth = 0.0;
	float heightFromMap = getHeightAt(currentTexCoords);

	vec2 deltaTexCoords = rayDir.xy * heightScale * stepSize / rayDir.z;

	// Step through the heightmap
	while (currentDepth < 1.0 - heightFromMap) {
		currentTexCoords -= deltaTexCoords;
		currentDepth += stepSize;
		heightFromMap = getHeightAt(currentTexCoords);
	}

	// get texture coordinates before collision (reverse operations)
	vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

	// get depth after and before collision for linear interpolation
	float afterDepth = (1.0 - heightFromMap) - currentDepth;
	float beforeDepth = (1.0 - getHeightAt(prevTexCoords)) - (currentDepth - stepSize);

	// interpolation of texture coordinates
	float weight = afterDepth / (afterDepth - beforeDepth);
	vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

	return finalTexCoords;
}

vec4 getNormal(vec3 eyeVec)
{
	// Scale the normal textures by waviness so that big waviness means bigger waves.
	vec2 scaledNormalCoords = (normalCoords.st + normalCoords.zw * speedMultiplier * waviness / 10.0) * mix(smallScale, bigScale, waviness / 10.0);

	float normalMix = clamp(baseNormalMix + fwaviness / maxNormalMixAt, 0.0, 1.0);
	
#if USE_FANCY_EFFECTS
	// Use parallax mapping, improving the look at somewhat oblique angles.
	scaledNormalCoords = parallaxMapping(mix(0.0, parallaxHeightScale, normalMix), scaledNormalCoords, -eyeVec);
#endif

	// This method uses 60 animated water frames. We're blending between each two frames
	vec3 ww1 = SAMPLE_2D(GET_DRAW_TEXTURE_2D(normalMap), scaledNormalCoords).xyz * 2.0 - 1.0;
	vec3 ww2 = SAMPLE_2D(GET_DRAW_TEXTURE_2D(normalMap2), scaledNormalCoords).xyz * 2.0 - 1.0;
	vec3 wwInterp = mix(ww1, ww2, moddedTime);

	// Normals are now in tangent space, transform into world space
	wwInterp = vec3(
		wwInterp.x * windCosSin.x + wwInterp.y * -windCosSin.y,
		wwInterp.z,
		wwInterp.x * windCosSin.y + wwInterp.y * windCosSin.x
	);

	// Flatten them based on waviness (includes wind effect)
	vec3 normal = normalize(mix(vec3(0.0, 1.0, 0.0), wwInterp, normalMix));

	return vec4(normal.x, normal.y, normal.z, getHeightAt(scaledNormalCoords));
}

vec3 getSpecular(vec3 normal, vec3 eyeVec)
{
	// Specular lighting vectors
	vec3 specularVector = reflect(sunDir, normal);
	// pow is undefined for null or negative values, except on intel it seems.
	float specularIntensity = pow(max(dot(specularVector, eyeVec), 0.0), 100.0);
	// Workaround to fix too flattened water.
	specularIntensity = smoothstep(0.6, 1.0, specularIntensity) * 1.2;
	return clamp(specularIntensity * sunColor, 0.0, 1.0);
}

vec4 getReflection(vec3 normal, vec3 eyeVec)
{
	// Reflections
	// 3 level of settings:
	// -If a player has refraction and reflection disabled, we return a gradient of blue based on the Y component.
	// -If a player has refraction OR reflection, we return a reflection of the actual skybox used.
	// -If a player has reflection enabled, we also return a reflection of actual entities where applicable.

	vec3 eye = reflect(eyeVec, normal);
	
#if USE_REFLECTION
	float refVY = clamp(eyeVec.y * 2.0, 0.05, 1.0);

	// Distort the reflection coords based on waves.
	// Compute how much the normals should divert the ray, plus fudge.
	float fac = 0.2 + dot(normal.xz, eyeVec.xz);
	vec2 normalDistort = fac * 30.0 * normal.xz / refVY;

	vec2 reflCoords = (0.5 * reflectionCoords.xy - normalDistort) / reflectionCoords.z + 0.5;
	vec4 refTex = SAMPLE_2D(GET_DRAW_TEXTURE_2D(reflectionMap), reflCoords);

	vec3 reflColor = refTex.rgb;

	// Interpolate between the sky color and nearby objects.
	// Only do this when alpha is rather low, or transparent leaves show up as extremely white.
	if (refTex.a < 0.4)
		reflColor = mix(SAMPLE_CUBE(GET_DRAW_TEXTURE_CUBE(skyCube), (vec4(eye, 0.0) * skyBoxRot).xyz).rgb, refTex.rgb, refTex.a);

	// Let actual objects be reflected fully, otherwise dim them slightly
	// to let refractions shine through.
	float reflMod = max(refTex.a, 0.9);
#else
	vec3 reflColor = SAMPLE_CUBE(GET_DRAW_TEXTURE_CUBE(skyCube), (vec4(eye, 0.0) * skyBoxRot).xyz).rgb;
	float reflMod = 0.9;
#endif

	return vec4(reflColor, reflMod);
}

#if USE_REFRACTION && USE_REAL_DEPTH
vec3 getWorldPositionFromRefractionDepth(vec2 uv)
{
	float depth = SAMPLE_2D(GET_DRAW_TEXTURE_2D(depthTex), uv).x;
	vec4 viewPosition = projInvTransform * (vec4((uv - vec2(0.5)) * 2.0, depth * 2.0 - 1.0, 1.0));
	viewPosition /= viewPosition.w;
	vec3 refrWorldPos = (viewInvTransform * viewPosition).xyz;
	// Depth buffer precision errors can give heights above the water.
	refrWorldPos.y = min(refrWorldPos.y, worldPos.y);
	return refrWorldPos;
}
#endif

vec4 getRefraction(vec3 normal, vec3 eyeVec, float depthLimit)
{
#if USE_REFRACTION && USE_REAL_DEPTH
	// Compute real depth at the target point.
	vec2 coords = (0.5 * refractionCoords.xy) / refractionCoords.z + 0.5;
	vec3 refrWorldPos = getWorldPositionFromRefractionDepth(coords);

	// Set depth to the depth at the undistorted point.
	float depth = distance(refrWorldPos, worldPos);
#else
	// fake depth computation: take the value at the vertex, add some if we are looking at a more oblique angle.
	float depth = waterDepth / (min(0.5, eyeVec.y) * 1.5 * min(0.5, eyeVec.y) * 2.0);
#endif

#if USE_REFRACTION
	// for refraction we want to distort more as depth goes down.
	// 1) compute a distortion based on depth at the pixel.
	// 2) Re-sample the depth at the target point
	// 3) Sample refraction texture

	// distoFactor controls the amount of distortion relative to wave normals.
	float distoFactor = 0.5 + clamp(depth / 2.0, 0.0, 7.0);

#if USE_REAL_DEPTH
	// Distort the texture coords under where the water is to simulate refraction.
	vec2 shiftedCoords = (0.5 * refractionCoords.xy - normal.xz * distoFactor) / refractionCoords.z + 0.5;
	vec3 refrWorldPos2 = getWorldPositionFromRefractionDepth(shiftedCoords);
	float newDepth = distance(refrWorldPos2, worldPos);

	// try to correct for fish. In general they'd look weirder without this fix.
	if (depth > newDepth + 3.0)
		distoFactor /= 2.0; // this in general will not fall on the fish but still look distorted.
	else
		depth = newDepth;
#endif

#if USE_FANCY_EFFECTS
	depth = depth + (depthLimit - 0.5) * 1.0;
	if (waterDepth < 0.0)
		depth = 0.0;
#endif

	// Distort the texture coords under where the water is to simulate refraction.
	vec2 refrCoords = (0.5 * refractionCoords.xy - normal.xz * distoFactor) / refractionCoords.z + 0.5;
	vec3 refColor = SAMPLE_2D(GET_DRAW_TEXTURE_2D(refractionMap), refrCoords).rgb;

	// Note, the refraction map is cleared using (255, 0, 0), so pixels outside of the water plane are pure red.
	// If we get a pure red fragment, use an undistorted/less distorted coord instead.
	// blur the refraction map, distoring using normal so that it looks more random than it really is
	// and thus looks much better.
	float blur = (0.1 + clamp(normal.x, -0.1, 0.1)) / refractionCoords.z;

	vec4 blurColor = vec4(refColor, 1.0);

	vec4 tex = SAMPLE_2D(GET_DRAW_TEXTURE_2D(refractionMap), refrCoords + vec2(blur + normal.x, blur + normal.z));
	blurColor += vec4(tex.rgb * tex.a, tex.a);
	tex = SAMPLE_2D(GET_DRAW_TEXTURE_2D(refractionMap), refrCoords + vec2(-blur, blur + normal.z));
	blurColor += vec4(tex.rgb * tex.a, tex.a);
	tex = SAMPLE_2D(GET_DRAW_TEXTURE_2D(refractionMap), refrCoords + vec2(-blur, -blur + normal.x));
	blurColor += vec4(tex.rgb * tex.a, tex.a);
	tex = SAMPLE_2D(GET_DRAW_TEXTURE_2D(refractionMap), refrCoords + vec2(blur + normal.z, -blur));
	blurColor += vec4(tex.rgb * tex.a, tex.a);
	blurColor /= blurColor.a;
	float blurFactor = (distoFactor / 7.0);
	refColor = (refColor + blurColor.rgb * blurFactor) / (1.0 + blurFactor);

#else // !USE_REFRACTION

#if USE_FANCY_EFFECTS
	depth = max(depth, depthLimit);
#endif

	vec3 refColor = color;
#endif

	// for refraction, we want to adjust the value by v.y slightly otherwise it gets too different between "from above" and "from the sides".
	// And it looks weird (again, we are not used to seeing water from above).
	float fixedVy = max(eyeVec.y, 0.01);

	float murky = mix(200.0, 0.1, pow(murkiness, 0.25));

	// Apply water tint and murk color.
	float extFact = max(0.0, 1.0 - (depth * fixedVy / murky));
	float ColextFact = max(0.0, 1.0 - (depth * fixedVy / murky));
	vec3 colll = mix(refColor * tint, refColor, ColextFact);
	vec3 refrColor = mix(color, colll, extFact);

	float alpha = clamp(depth, 0.0, 1.0);

#if !USE_REFRACTION
	alpha = (1.4 - extFact) * alpha;
#endif
	return vec4(refrColor, alpha);
}

float getShoreFoam(vec3 normal) {
	if (waterInfo.r > 10.0)
		return 0.0;

	// Shift the coordinates a little differently for the two samples.
	vec2 shiftA = worldPos.xz / 6.0 + vec2(0.1, -0.2) * vec2(cos(time), sin(time)) * 0.3;
	vec2 shiftB = worldPos.zx * 0.1 + vec2(0.4, 0.8) * time * 0.05;

	// Modulate the first layer over time for more randomness
	float modulateA = (0.9 + 0.2 * cos(time + worldPos.x / 20.0 + worldPos.z / 20.0));

	float ftx = SAMPLE_2D(GET_DRAW_TEXTURE_2D(foamTex), waviness/20.0 * normal.xz + shiftA).r * modulateA;
	ftx *= 1.0 - SAMPLE_2D(GET_DRAW_TEXTURE_2D(foamTex), waviness/20.0 * normal.zx + shiftB).r;
	ftx = clamp(ftx * 2.0, 0.0, 1.0);

	float shoreDistFactor = mix(
		(shoreFoam - waterInfo.r),
		(shoreFoam - waterInfo.r * 0.38),
		waterInfo.b *  waviness / 8.0 // Allow it to a little beyond that at really high settings
	);
	ftx = ftx * clamp(shoreDistFactor, 0.0, 1.0);
	return clamp((ftx - 0.3) * 1.0, 0.0, 1.0) + ftx * 0.5;
}

void main()
{
	float los = getLOS(GET_DRAW_TEXTURE_2D(losTex), v_los);
	// We don't need to render a water fragment if it's invisible.
	if (los < 0.001)
	{
		OUTPUT_FRAGMENT_SINGLE_COLOR(vec4(0.0, 0.0, 0.0, 1.0));
		return;
	}

	vec3 eyeVec = v_eyeVec / v_eyeDistance;
	vec4 normal_height = getNormal(eyeVec);
	vec3 normal = normal_height.xyz;

#if USE_FANCY_EFFECTS
	float foamFactor = SAMPLE_2D(GET_DRAW_TEXTURE_2D(waterEffectsTex), gl_FragCoord.xy / screenSize + normal.xz * 0.01).r;
	foamFactor = mix((foamFactor - 0.3) * 2.0, (foamFactor - 0.1) * 2.0, fwaviness / 10.0);
	foamFactor = max(foamFactor, getShoreFoam(normal));
#else
	foamFactor = getShoreFoam(normal);
#endif

	vec4 refrColor = getRefraction(normal, eyeVec, normal_height.a);
	vec4 reflColor = getReflection(normal, eyeVec);

	// How perpendicular to the normal our view is. Used for fresnel.
	float ndotv = clamp(dot(normal, eyeVec), 0.0, 1.0);

	// Fresnel for "how much reflection vs how much refraction".
	float fresnel = clamp(((pow(1.1 - ndotv, 2.0)) * 1.5), 0.1, 0.9); // Approximation. I'm using 1.1 and not 1.0 because it causes artifacts, see #1714

	vec3 specular = getSpecular(normal, eyeVec);

#if USE_SHADOW
	float shadow = getShadowOnLandscape();
	fresnel = mix(fresnel, fresnel * shadow, 0.05 + murkiness * 0.2);
#else
	float shadow = 1.0;
#endif

	vec3 color = mix(refrColor.rgb, reflColor.rgb, fresnel * reflColor.a);
	color += shadow * specular;

	color = clamp(mix(color, vec3(1.0), clamp(foamFactor, 0.0, 1.0)), 0.0, 1.0);
	color = applyFog(color, fogColor, fogParams);

	OUTPUT_FRAGMENT_SINGLE_COLOR(vec4(applyDebugColor(color * los, 1.0, refrColor.a, 0.0), refrColor.a));
}
