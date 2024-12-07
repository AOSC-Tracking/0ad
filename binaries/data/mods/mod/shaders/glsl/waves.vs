#version 110

#include "waves.h"

#include "common/vertex.h"

VERTEX_INPUT_ATTRIBUTE(0, vec3, a_Position);
VERTEX_INPUT_ATTRIBUTE(1, vec2, a_uv0);

void main()
{
	v_tex = a_uv0.xy;

	ttime = (time + translation) * 0.5;

	worldPos = a_Position;

	OUTPUT_VERTEX_POSITION(transform * vec4(worldPos, 1.0));
}
