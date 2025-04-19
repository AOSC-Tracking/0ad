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

#ifndef INCLUDE_PS_UNORDERED_MAP
#define INCLUDE_PS_UNORDERED_MAP

#include "ps/containers/Containers.h"

#include <functional>
#include <memory>
#include <unordered_map>

namespace PS
{

template<class Key, class T, class Hash = std::hash<Key>, class KeyEqual = std::equal_to<Key>, class Allocator = PS::Allocator<std::pair<const Key, T>>>
using unordered_map = std::unordered_map<Key, T, Hash, KeyEqual, Allocator>;

} // namespace PS

#endif // INCLUDE_PS_UNORDERED_MAP
