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

#include "CGUILayoutPadding.h"

#include "ps/CLogger.h"
#include "scriptinterface/ScriptConversions.h"
#include "gui/CGUI.h"
#include "gui/CGUISetting.h"
#include <sstream>
#include <vector>

CGUILayoutPadding::CGUILayoutPadding(int left, int top, int right, int bottom)
	: m_Left(left), m_Top(top), m_Right(right), m_Bottom(bottom)
{
}

CGUILayoutPadding::CGUILayoutPadding(int allSides)
	: m_Left(allSides), m_Top(allSides), m_Right(allSides), m_Bottom(allSides)
{
}

CGUILayoutPadding::CGUILayoutPadding(int horizontal, int vertical)
	: m_Left(horizontal), m_Top(vertical), m_Right(horizontal), m_Bottom(vertical)
{
}

bool CGUILayoutPadding::operator==(const CGUILayoutPadding& other) const
{
	return (m_Left == other.m_Left) &&
		(m_Top == other.m_Top) &&
		(m_Right == other.m_Right) &&
		(m_Bottom == other.m_Bottom);
}

bool CGUILayoutPadding::FromString(const CStr8& Value)
{
	std::istringstream stream(Value);
	std::vector<int> values;

	int n{0};
	int size{0};
	while (stream >> n)
	{
		if (n < 0)
		{
			LOGERROR("CGUILayoutPadding: Negative padding value '%d' is not allowed.", n);
			return false;
		}
		values.push_back(n);
		size++;
	}

	// Stream error while reading → invalid (e.g. "10 abc").
	if (!stream.eof())
		return false;


	if (size == 0 || size == 3 || size > 4)
	{
		LOGERROR("CGUILayoutPadding: Invalid number of padding values (%zu). Expected 1, 2, or 4.", size);
		return false;
	}

	switch (size)
	{
	case 1:
		m_Left = m_Top = m_Right = m_Bottom = values.at(0);
		break;
	case 2:
		m_Left = m_Right = values.at(0);
		m_Top = m_Bottom = values.at(1);
		break;
	case 4:
		m_Left = values.at(0);
		m_Top = values.at(1);
		m_Right = values.at(2);
		m_Bottom = values.at(3);
		break;
	default:
		return false;
	}

	return true;
}
const CStr8 CGUILayoutPadding::ToString() const
{
	if (m_Left == m_Top && m_Top == m_Right && m_Right == m_Bottom)
		return fmt::format("{}", m_Left);

	if (m_Left == m_Right && m_Top == m_Bottom)
		return fmt::format("{} {}", m_Left, m_Top);

	return fmt::format("{} {} {} {}", m_Left, m_Top, m_Right, m_Bottom);
}

bool CGUILayoutPadding::operator!=(const CGUILayoutPadding& other) const
{
	return !(*this == other);
}

template <> void Script::ToJSVal<CGUILayoutPadding>(const ScriptRequest& rq, JS::MutableHandleValue ret, const CGUILayoutPadding& val)
{
	ToJSVal(rq, ret, val.ToString());
}

template <> bool Script::FromJSVal<CGUILayoutPadding>(const ScriptRequest& rq, JS::HandleValue v, CGUILayoutPadding& out)
{
	if (!v.isString())
	{
		LOGERROR("CGUILayoutPadding value must be an string!");
		return false;
	}
	std::string value;
	if (!FromJSVal(rq, v, value))
		return false;
	return out.FromString(value);
}

template <>
bool CGUI::ParseString<CGUILayoutPadding>(const CGUI*, const CStrW& Value, CGUILayoutPadding& Output)
{
	return Output.FromString(Value.ToUTF8());
}
