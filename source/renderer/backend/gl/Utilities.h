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

#ifndef INCLUDED_RENDERER_BACKEND_VULKAN_UTILITIES
#define INCLUDED_RENDERER_BACKEND_VULKAN_UTILITIES

#include "lib/ogl.h"

namespace Renderer
{

namespace Backend
{

namespace GL
{

namespace Utilities
{

/**
 * raise a warning (break into the debugger) if an OpenGL error is pending.
 * resets the OpenGL error state afterwards.
 *
 * when an error is reported, insert calls to this in a binary-search scheme
 * to quickly narrow down the actual error location.
 *
 * reports a bogus invalid_operation error if called before OpenGL is
 * initialized, so don't!
 *
 * disabled in release mode for efficiency and to avoid annoying errors.
 **/
void WarnIfErrorLoc(const char *file, int line);
#ifdef NDEBUG
# define ogl_WarnIfError()
#else
# define ogl_WarnIfError() Utilities::WarnIfErrorLoc(__FILE__, __LINE__)
#endif

/**
* get a name of the error.
*
* useful for debug.
*
* @return read-only C string of unspecified length containing
* the error's name.
**/
const char* GetErrorName(GLenum err);

/**
 * ignore and reset the specified OpenGL error.
 *
 * this is useful for suppressing annoying error messages, e.g.
 * "invalid enum" for GL_CLAMP_TO_EDGE even though we've already
 * warned the user that their OpenGL implementation is too old.
 *
 * call after the fact, i.e. the error has been raised. if another or
 * different error is pending, those are reported immediately.
 *
 * @param err_to_ignore: one of the glGetError enums.
 * @return true if the requested error was seen and ignored
 **/
bool SquelchError(GLenum errorToIgnore);

} // namespace Utilities

} // namespace GL

} // namespace Backend

} // namespace Renderer

#endif // INCLUDED_RENDERER_BACKEND_VULKAN_UTILITIES
