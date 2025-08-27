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
#ifndef INCLUDED_OPENALHELPERS_H
#define INCLUDED_OPENALHELPERS_H
#include "lib/config2.h"
#if CONFIG2_AUDIO
#include <AL/al.h>
#include <AL/alc.h>
#include <stdexcept>
#include <type_traits>
#include <string_view>

namespace PS::Audio
{
struct AlError : std::runtime_error {
	ALenum code;
	const std::string_view& filename;
	const int line;

	explicit AlError(ALenum c, const std::string_view& filename, const int line);

	static const char* name(ALenum c) noexcept;
};

struct AlcError : std::runtime_error {
	ALCenum code;
	const std::string_view& filename;
	const int line;

	explicit AlcError(ALCenum c, const std::string_view& filename, const int line);

	static const char* name(ALCenum c) noexcept;
};

void CheckALErrors(const std::string_view& filename, const int line);
void CheckAlcErrors(ALCdevice* device, const std::string_view& filename, const int line);

template<typename Func, typename... Args>
decltype(auto) AlCall(const std::string_view& filename, const int line, Func&& func, Args&&... args)
{
	using R = std::invoke_result_t<Func, Args...>;
	if constexpr (std::is_same_v<void, R>)
	{
		std::invoke(std::forward<Func>(func),std::forward<Args>(args)...);
		CheckALErrors(filename, line);
		return;
	}
	else
	{
		R result = std::invoke(std::forward<Func>(func), std::forward<Args>(args)...);
		CheckALErrors(filename, line);
		return result;
	}
}

template<typename Func, typename... Args>
decltype(auto) AlcCall(const std::string_view& filename, const int line, Func&& func,ALCdevice* device, Args&&... args)
{
	using R = std::invoke_result_t<Func, ALCdevice*, Args...>;
	if constexpr (std::is_same_v<void, R>)
	{
		std::invoke(std::forward<Func>(func), device, std::forward<Args>(args)...);
		CheckAlcErrors(device, filename, line);
		return;
	}
	else
	{
		R result = std::invoke(std::forward<Func>(func), device, std::forward<Args>(args)...);
		CheckAlcErrors(device, filename, line);
		return result;
	}
}
} // namespace PS::Audio

#define PS_AUDIO_AL_CALL(func, ...) PS::Audio::AlCall(__FILE__, __LINE__, func, __VA_ARGS__)
#define PS_AUDIO_ALC_CALL(func, device, ...) PS::Audio::AlcCall(__FILE__, __LINE__, func, device, __VA_ARGS__)

#endif // CONFIG2_AUDIO
#endif // INCLUDED_OPENALHELPERS_H
