/* Copyright (C) 2025 Wildfire Games.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * The compatibility version should not be changed as long as the simulation
 * stays compatible (no OOS in multiplayer, identical outcomes in replays, etc.)
 * and as long as the engine modding API is not modified.
 * Upon main releases, the compat version is set to 0.x: patch releases are not
 * supposed to break compatibility.
 * In case a patch release is forced to lose compatibility because of a breaking
 * issue, this value is set to the patch version 0.x.y, and stays at that value
 * for subsequent patch releases of the same main release. This will warrant the
 * opening of a new lobby room.
 */
#define PYROGENESIS_COMPAT_VERSION "0.28"

/*
 * The display version and its Windows WORD representation is only used for logging,
 * reports, etc. It is bumped at each patch release and can be safely changed downstream.
 */
#define PYROGENESIS_DISPLAY_VERSION "0.28.0"
#define PYROGENESIS_VERSION_WORD 0,28,0,0

extern wchar_t build_version[];
