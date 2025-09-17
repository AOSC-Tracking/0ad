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

/*
Pyrogenesis.h

Standard declarations which are included in all projects.
*/

#ifndef INCLUDED_PYROGENESIS
#define INCLUDED_PYROGENESIS

#include <cstdio>

class Path;
using OsPath = Path;

/*
 * Engine version values are set in "lib/build_version.h".
 * The compat_version signals compatibility when playing over the network, when replaying simulation commands,
 * and with respect to the modding API.
 * The display_version can be freely modified and must only be used in logging and reporting.
 */
extern const char* engine_compat_version;
extern const char* engine_display_version;

extern const char* main_window_name;

extern void psBundleLogs(FILE* f); // set during InitVfs
extern void psSetLogDir(const OsPath& logDir);	// set during InitVfs
extern const OsPath& psLogDir();	// used by AppHooks and engine code when reporting errors

#endif
