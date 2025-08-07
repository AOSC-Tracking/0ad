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

#ifndef INCLUDE_CGUILAYOUTPADDING
#define INCLUDE_CGUILAYOUTPADDING

#include "ps/CStr.h"

/**
 * CGUILayoutPadding – simple integer padding helper.
 *
 *  ┌────── top ──────┐
 *  │                 │
 *  │  ┌── content ─┐ │
 *  │  │            │ │
 *  │  └────────────┘ │
 *  │                 │
 *  └─ left ──┴─── right
 *             bottom
 */
class CGUILayoutPadding {
public:
	CGUILayoutPadding() = default;
	CGUILayoutPadding(int left, int top, int right, int bottom);
	CGUILayoutPadding(int allSides);
	CGUILayoutPadding(int horizontal, int vertical);
	~CGUILayoutPadding() = default;
	bool operator==(const CGUILayoutPadding& other) const;
	bool operator!=(const CGUILayoutPadding& other) const;

	/// Parse a space-separated string (1 / 2 / 4 integers).
    ///
    /// @param value Space-separated integers.
    ///              * **"n"**           → *n n n n*
    ///              * **"lr tb"**       → *lr tb lr tb*
    ///              * **"l t r b"**     → *l t r b*
    /// @returns **true** on success, **false** on syntax error.
	bool FromString(const CStr8& Value);

	/// Serialise to the shortest legal form.
    ///
    /// * equal on every side  → `"n"`
    /// * equal LR & TB        → `"lr tb"`
    /// * all different        → `"l t r b"`
	const CStr8 ToString() const;

	int GetLeft() const { return m_Left; }
	int GetTop() const { return m_Top; }
	int GetRight() const { return m_Right; }
	int GetBottom() const { return m_Bottom; }
	int GetHorizontal() const { return m_Left + m_Right; }
	int GetVertical() const { return m_Top + m_Bottom; }
private:
	int m_Left{0};
	int m_Top{0};
	int m_Right{0};
	int m_Bottom{0};
};
#endif // !INCLUDE_CGUILAYOUTPADDING
