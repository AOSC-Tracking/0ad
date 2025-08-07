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

#include "CGUILayoutSizing.h"
#include <charconv>
#include <limits>
#include <algorithm>
#include <cctype>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <sstream>

namespace
{
void Trim(std::string& s)
{
	auto notSpace = [](unsigned char c) { return !std::isspace(c); };
	s.erase(s.begin(), std::find_if(s.begin(), s.end(), notSpace));
	s.erase(std::find_if(s.rbegin(), s.rend(), notSpace).base(), s.end());
}
void ToLower(std::string& s)
{
	std::transform(s.begin(), s.end(), s.begin(),
		[](unsigned char c) { return std::tolower(c); });
}

bool ParseNumberPx(const std::string& str, int& value)
{
	if (str.empty())
		return false;

	// Remove "px" suffix if present.
	std::string numStr = str;
	if (numStr.size() > 2 && numStr.compare(numStr.size() - 2, 2, "px") == 0)
		numStr.resize(numStr.size() - 2);

	try
	{
		size_t pos;
		value = std::stoi(numStr, &pos);
		// Invalid number or negative value.
		if (pos != numStr.size() || value < 0)
			return false;
		return true;
	}
	catch (const std::invalid_argument&)
	{
		// Not a valid integer.
		return false;
	}
	catch (const std::out_of_range&)
	{
		// Integer overflow.
		return false;
	}
	catch (...)
	{
		// Catch-all for any other exceptions.
		return false;
	}
}
} // namespace

CGUILayoutSizing::CGUILayoutSizing(LayoutSizingType type, int percent, int min, int max)
	: m_Type(type)
{
	if (m_Type == LayoutSizingType::PERCENT)
		m_Percent = std::max(0, std::min(100, percent));

	m_Min = std::max(0, min);
	m_Max = std::max(m_Min, max);
}

bool CGUILayoutSizing::operator==(const CGUILayoutSizing& other) const
{
	return (m_Type == other.m_Type) &&
		(m_Percent == other.m_Percent) &&
		(m_Min == other.m_Min) &&
		(m_Max == other.m_Max);
}

bool CGUILayoutSizing::operator!=(const CGUILayoutSizing& other) const
{
	return !(*this == other);
}

/**
* Goal: Provide a simple, XML-friendly string syntax that lets modders specify how a GUI
* object's width/height should be computed: as a fixed pixel value, as a percentage of the
* parent, or as a content-driven "fit" size. Optional min/max clamps can be supplied.
* Usage context: 0 A.D. GUI XML attributes e.g.
*   <Object name="MyLabel" layoutWidth="50%" layoutHeight="fit(16,64)" />
* Design Priorities
* -----------------
*  1. **Readable & familiar**: Modders are used to CSS. We'll borrow a subset of CSS sizing
*     idioms (percentages, px, fit-content-like keyword, clamp-like range).
*  2. **XML-friendly**: Avoid characters that need heavy escaping. Parentheses and commas are
*     safe in XML attribute values; so are %, -, digits, and letters.
*  3. **Cheap to parse**: The engine will parse these strings frequently; keep grammar simple.
*  4. **Predictable fallback**: On parse error, default to FIT (content size) and log warning.
*
*  Supported Forms (EBNF)
*  ----------------------
*
*    LAYOUT-SIZE  := PRIMARY [ RANGE ] ;
*    PRIMARY      := FIT | GROW | PERCENT | FIXED ;
*    FIT          := "fit" | "auto" ;               // synonyms
*    PERCENT      := NUMBER "%" ;                   // e.g. 50% ; NUMBER may be float
*    FIXED        := NUMBER ["px"] ;                // e.g. 200 or 200px
*    GROW         := "grow" ;                       // special case: grow to fill available space
*
*    RANGE        := '(' [ MIN ] [ ',' MAX ] ')'     // optional clamp; min and/or max in pixels
*                 | '(' MIN ',' MAX ')' ;            // both
*    MIN          := NUMBER ["px"] ;                 // pixel clamp
*    MAX          := NUMBER ["px"] ;
*
*    // Alternative CSS-y long form:
*    CLAMP        := "clamp(" MIN ',' PRIMARY ',' MAX ')' ;
*    // Recognised by looking for leading "clamp("; takes precedence over the above if matched.
*
*  Notes:
*  * Percentages are always relative to the *available parent size* in that axis.
*  * FIT means: size to the object's content (text, children, intrinsic size) before clamping.
*  * GROW means: expand to fill all available space in that axis, using min/max.
*  * Min/Max clamps are *pixels* because mixing percent clamps gets confusing; keep simple.
*  * Negative numbers are clamped to 0 during parse.
*
*  Examples
*  --------
*    "fit"              -> FIT,   percent=0, min=0,  max=0 (no clamp)
*    "auto"             -> FIT,   percent=0
*    "100"              -> FIXED, percent=0, min=100, max=100 (no "px" suffix)
*    "100px"            -> FIXED, percent=0, min=100, max=100
*    "75%"              -> PERCENT, percent=75, min=0, max=0 (no clamp)
*    "75%(10,300)"      -> PERCENT, percent=75, min=10px, max=300px
*    "fit(0,128)"       -> FIT w/ max=128px
*    "fit(32,)"         -> FIT w/ min=32px, no max (comma optional trailing)
*    "clamp(20,50%,200)"-> PERCENT 50, min=20, max=200
*    "clamp(0,fit,400)" -> FIT w/ max=400
*
*  Parsing Strategy
*  ----------------
*  1. Trim whitespace, lowercase.
*  2. If starts_with("clamp(") -> parse clamp(min, primary, max).
*  3. Else parse PRIMARY until '(' or end.
*  4. If '(' present -> parse optional min/max list.
*  5. Validate & store.
*
*  Error Handling
*  --------------
*  On failure: leave object in default FIT state; return false so caller can log.
*/
bool CGUILayoutSizing::FromString(const CStr8& Value)
{
	std::string str{Value};
	Trim(str);
	ToLower(str);

	if (str.empty())
		return false;

	// Check for clamp() first.
	if (str.rfind("clamp(", 0) == 0 && str.back() == ')')
	{
		// strip "clamp(" and ")".
		std::string inside{ str.substr(6, str.size() - 7) };
		return ParseClamp(inside);
	}

	// Split primary + optional (range)
	std::string primary;
	std::string range;
	size_t parenPos = str.find('(');

	if (parenPos != std::string::npos)
	{
		if (str.back() != ')')
			return false;

		// Split at first '('
		primary = str.substr(0, parenPos);
		range = str.substr(parenPos + 1, str.size() - parenPos - 2);
	}
	else
		primary = str;

	Trim(primary);
	if (!ParsePrimary(primary))
		return false;

	if (!range.empty())
		ParseRange(range);

	return true;
}

bool CGUILayoutSizing::ParsePrimary(const std::string& primary)
{
	if (primary == "fit" || primary == "auto")
	{
		m_Type = LayoutSizingType::FIT;
		m_Percent = 0;
		m_Min = 0;
		m_Max = 0;
		return true;
	}

	if (primary == "grow")
	{
		m_Type = LayoutSizingType::GROW;
		// Grow doesn't use percent.
		m_Percent = 0;
		m_Min = 0;
		m_Max = 0;
		return true;
	}

	if (primary == "shrink")
	{
		m_Type = LayoutSizingType::SHRINK;
		// Shrink doesn't use percent.
		m_Percent = 0;
		m_Min = 0;
		m_Max = 0;
		return true;
	}

	if (primary.back() == '%')
	{
		std::string percentStr = primary.substr(0, primary.size() - 1);
		m_Percent = 0;
		if (!ParseNumberPx(percentStr, m_Percent) || m_Percent < 0.0f || m_Percent > 100.f)
			return false;

		m_Type = LayoutSizingType::PERCENT;
		m_Min = 0;
		m_Max = 0;
		return true;
	}

	m_Type = LayoutSizingType::FIXED;
	int value{0};
	if (!ParseNumberPx(primary, value) || value < 0)
		return false;

	m_Percent = 0;
	m_Min = value;
	m_Max = value;

	return true;
}

bool CGUILayoutSizing::ParseClamp(const std::string& inside)
{
	// Format: clamp(min, primary, max)
	// min and max are optional.
	const size_t comma1{inside.find(',')};
	const size_t comma2{inside.rfind(',')};
	if (comma1 == std::string::npos || comma2 == std::string::npos || comma1 == comma2)
		return false;
	const std::string minStr{inside.substr(0, comma1)};
	const std::string primaryStr{inside.substr(comma1 + 1, comma2 - comma1 - 1)};
	const std::string maxStr{inside.substr(comma2 + 1)};

	int vMin{0};
	int vMax{0};

	if (!minStr.empty())
		ParseNumberPx(minStr, vMin);

	if (!maxStr.empty())
		ParseNumberPx(maxStr, vMax);

	if (!ParsePrimary(primaryStr))
		return false;

	m_Min = std::max(0, vMin);
	m_Max = std::max(m_Min, vMax);
	return true;
}

bool CGUILayoutSizing::ParseRange(const std::string& inside)
{
	// Format: [min][,max]  both optional; pixel units only.
	// Example: "(10,300)" || "(,300)" || "(10,)" || "(128)" (interpreted as min=128, no max).
	std::string s{inside};
	Trim(s);
	size_t commaPos = s.find(',');
	int minValue{0};
	int maxValue{0};

	if (commaPos == std::string::npos && !s.empty())
		ParseNumberPx(s, minValue);
	else
	{
		std::string minStr = s.substr(0, commaPos);
		std::string maxStr = s.substr(commaPos + 1);
		Trim(minStr);
		Trim(maxStr);
		if (!minStr.empty())
			ParseNumberPx(minStr, minValue);
		if (!maxStr.empty())
			ParseNumberPx(maxStr, maxValue);
	}

	m_Min = std::max(0, minValue);
	m_Max = std::max(m_Min, maxValue);

	return true;
}

const CStr8 CGUILayoutSizing::ToString() const
{
	std::ostringstream ss;
	ss.setf(std::ios::fixed);
	ss.precision(0);

	switch (m_Type)
	{
	case LayoutSizingType::FIT:
		ss << "fit";
		break;
	case LayoutSizingType::GROW:
		ss << "grow";
		break;
	case LayoutSizingType::PERCENT:
		ss << m_Percent << '%';
		break;
	case LayoutSizingType::FIXED:
		// m_Min == m_Max for fixed.
		ss << m_Min;
		break;
	default:
		break;
	}

	if (m_Min == m_Max && m_Min == 0.0f)
		return ss.str();

	ss << '(' << m_Min;

	if (m_Max == std::numeric_limits<float>::max())
		ss << ')'; // No max, just min.
	else
		ss << ',' << m_Max << ')';

	return ss.str();
}
