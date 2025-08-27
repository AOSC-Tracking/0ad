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

#include "OpenALHelpers.h"

#if CONFIG2_AUDIO
#include <AL/al.h>
#include <AL/alc.h>
#include <sstream>

namespace PS::Audio
{
const char* AlError::name(ALenum c) noexcept {
	switch (c) {
		case AL_INVALID_NAME:      return "AL_INVALID_NAME";
		case AL_INVALID_ENUM:      return "AL_INVALID_ENUM";
		case AL_INVALID_VALUE:     return "AL_INVALID_VALUE";
		case AL_INVALID_OPERATION: return "AL_INVALID_OPERATION";
		case AL_OUT_OF_MEMORY:     return "AL_OUT_OF_MEMORY";
		default:                   return "AL_UNKNOWN_ERROR";
	}
}

const char* AlcError::name(ALCenum c) noexcept {
	switch (c) {
		case ALC_INVALID_DEVICE: return "ALC_INVALID_DEVICE";
		case ALC_INVALID_CONTEXT:return "ALC_INVALID_CONTEXT";
		case ALC_INVALID_ENUM:   return "ALC_INVALID_ENUM";
		case ALC_INVALID_VALUE:  return "ALC_INVALID_VALUE";
		case ALC_OUT_OF_MEMORY:  return "ALC_OUT_OF_MEMORY";
		default:                 return "ALC_UNKNOWN_ERROR";
	}
}

AlError::AlError(ALenum c, const std::string_view& filename, const int line)
  : std::runtime_error([&]{
		std::ostringstream os{};
		os << "[AL] " << name(c) << " (0x" << std::hex << static_cast<unsigned>(c) << std::dec
		   << ") at " << filename << ":" << line;
		return os.str();
	}()),
	code(c),
	filename(filename),
	line(line)
{}

AlcError::AlcError(ALCenum c, const std::string_view& filename, const int line)
  : std::runtime_error([&]{
		std::ostringstream os;
		os << "[ALC] " << name(c) << " (0x" << std::hex << static_cast<unsigned>(c) << std::dec
		   << ") at " << filename << ":" << line;
		return os.str();
	}()),
	code(c),
	filename(filename),
	line(line)
{}

void CheckALErrors(const std::string_view& filename, const int line)
{
	const ALenum err = alGetError();
	if (err != AL_NO_ERROR)
		throw AlError(err, filename, line);
}

void CheckAlcErrors(ALCdevice* device, const std::string_view& filename, const int line)
{
	if (!device)
		throw AlcError(ALC_INVALID_DEVICE, filename, line);

	const ALCenum err = alcGetError(device);
	if (err != ALC_NO_ERROR)
		throw AlcError(err, filename, line);
}
}
#endif // CONFIG2_AUDIO
