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

#ifndef INCLUDE_CGUILAYOUTSIZING
#define INCLUDE_CGUILAYOUTSIZING

#include "ps/CStr.h"

enum class LayoutSizingType {
	FIT,
	GROW,
	SHRINK,
	PERCENT,
	FIXED,
};

class CGUILayoutSizing {
public:
	CGUILayoutSizing() = default;
	CGUILayoutSizing(LayoutSizingType type, int percent, int min, int max);
	~CGUILayoutSizing() = default;

	bool operator==(const CGUILayoutSizing& other) const;
	bool operator!=(const CGUILayoutSizing& other) const;

	bool FromString(const CStr8& Value);
	const CStr8 ToString() const;

	LayoutSizingType GetType() const { return m_Type; }
	int GetPercent() const { return m_Percent; }
	int GetMin() const { return m_Min; }
	int GetMax() const { return m_Max; }
private:
	LayoutSizingType m_Type{LayoutSizingType::FIT};
	int m_Percent{0};
	int m_Min{0};
	int m_Max{0};

	bool ParseClamp(const std::string& inside);
	bool ParseRange(const std::string& inside);
	bool ParsePrimary(const std::string& primary);
};

#endif // !INCLUDE_CGUILAYOUTSIZING
