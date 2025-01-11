/* Copyright (c) 2022 Wildfire Games
 * SPDX-License-Identifier: GPL-2.0-or-later
 * SPDX-FileCopyrightText: © 2022 Wildfire Games
 */

#ifndef INCLUDED_LIBJPEG
#define INCLUDED_LIBJPEG

extern "C" {
// we are not a core library module, so don't define JPEG_INTERNALS
#include <jpeglib.h>
#include <jerror.h>
}

// automatically link against the required library
#if MSC_VERSION
# ifdef NDEBUG
#  pragma comment(lib, "jpeg-6b.lib")
# else
#  pragma comment(lib, "jpeg-6bd.lib")
# endif	// #ifdef NDEBUG
#endif	// #ifdef MSC_VERSION

#endif	// #ifndef INCLUDED_LIBJPEG
