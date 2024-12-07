#version 110

#include "waves.h"

#include "common/fragment.h"

vec2 getWaveOuter(float distanceToShore, float time) {
	vec2 waveintensity = SAMPLE_2D(GET_DRAW_TEXTURE_2D(waveTex), vec2(time*0.1, distanceToShore)).gr;

	vec2 coords = worldPos.xz / 6.0;
	vec2 shift = vec2(cos(time) / 10.0, sin(time + 0.5) / 20.0);
	float ftx = SAMPLE_2D(GET_DRAW_TEXTURE_2D(foamTex), coords).r;
	ftx *= 1.0 - SAMPLE_2D(GET_DRAW_TEXTURE_2D(foamTex), coords * 0.7 + shift).r;
	ftx = clamp(ftx * 1.5, 0.0, 1.5);
	return vec2(waveintensity.r * mix(ftx, 1.0, clamp(waveintensity.r - 0.4, 0.0, 1.0)), waveintensity.g);
}

void main()
{
	vec2 wave = getWaveOuter(1.0 - v_tex.y, mod(ttime + abs(cos(v_tex.x * 7.0)) * 0.0, 10.0));
	wave += getWaveOuter(1.0 - v_tex.y, mod(ttime + abs(sin(v_tex.x * 7.0)) * 0.05 + 5.0, 10.0));
	wave *= 1.0 - clamp(abs(0.5 - v_tex.x) - 0.2, 0.0, 1.0) * 3.0;
	OUTPUT_FRAGMENT_SINGLE_COLOR(vec4(wave, 0.0, max(wave.r, wave.g) > 0.01 ? 1.0 : 0.0));
}
