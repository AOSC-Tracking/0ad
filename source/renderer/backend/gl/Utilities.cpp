/* Copyright (C) 2025 Wildfire Games.
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

#include "Utilities.h"

#include "lib/code_annotation.h"
#include "lib/config2.h"

namespace Renderer
{

namespace Backend
{

namespace GL
{

namespace Utilities
{

const char* GetErrorName(GLenum err)
{
#define E(e) case e: return #e;
	switch (err)
	{
	E(GL_INVALID_ENUM)
	E(GL_INVALID_VALUE)
	E(GL_INVALID_OPERATION)
#if !CONFIG2_GLES
	E(GL_STACK_OVERFLOW)
	E(GL_STACK_UNDERFLOW)
#endif
	E(GL_OUT_OF_MEMORY)
	E(GL_INVALID_FRAMEBUFFER_OPERATION)
	default: break;
	}
#undef E

	return "Unknown GL error";
}

static void DumpGLError(GLenum err)
{
	debug_printf("OGL| %s (%04x)\n", GetErrorName(err), err);
}

void WarnIfErrorLoc(const char* file, int line)
{
	// glGetError may return multiple errors, so we poll it in a loop.
	// the debug_printf should only happen once (if this is set), though.
	bool errorEnountered{false};
	GLenum firstError{0};

	for (;;)
	{
		const GLenum err{glGetError()};
		if (err == GL_NO_ERROR)
			break;

		if (!errorEnountered)
			firstError = err;

		errorEnountered = true;
		DumpGLError(err);
	}

	if (errorEnountered)
	{
		debug_printf("%s:%d: OpenGL error(s) occurred: %s (%04x)\n",
			file, line, GetErrorName(firstError), static_cast<unsigned int>(firstError));
	}
}

// ignore and reset the specified error (as returned by glGetError).
// any other errors that have occurred are reported as ogl_WarnIfError would.
//
// this is useful for suppressing annoying error messages, e.g.
// "invalid enum" for GL_CLAMP_TO_EDGE even though we've already
// warned the user that their OpenGL implementation is too old.
bool SquelchError(GLenum errorToIgnore)
{
	// glGetError may return multiple errors, so we poll it in a loop.
	// the debug_printf should only happen once (if this is set), though.
	bool errorEnountered{false};
	bool errorIgnored{false};
	GLenum firstError{0};

	for (;;)
	{
		const GLenum err{glGetError()};
		if (err == GL_NO_ERROR)
			break;

		if (err == errorToIgnore)
		{
			errorIgnored = true;
			continue;
		}

		if (!errorEnountered)
			firstError = err;

		errorEnountered = true;
		DumpGLError(err);
	}

	if (errorEnountered)
		debug_printf("OpenGL error(s) occurred: %04x\n", static_cast<unsigned int>(firstError));

	return errorIgnored;
}

} // namespace Utilities

} // namespace GL

} // namespace Backend

} // namespace Renderer
