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

#include "lib/self_test.h"

#include "gui/CGUI.h"
#include "gui/SettingTypes/CGUILayoutSizing.h"
#include "gui/SettingTypes/CGUILayoutPadding.h"
#include "gui/SettingTypes/CGUISize.h"
#include "maths/Rect.h"
#include "maths/Size2D.h"
#include "maths/Vector2D.h"
#include "ps/CLogger.h"
#include "ps/CStr.h"

class TestGuiParseString : public CxxTest::TestSuite
{
public:
	void test_guisize()
	{
		TestLogger nolog;
		CGUISize size;

		// Test only pixels
		TS_ASSERT(size.FromString("0.0 -10 20.0 -30"));
		TS_ASSERT_EQUALS(size, CGUISize(CRect(0, -10, 20, -30), CRect(0, 0, 0, 0)));

		// Test only pixels, but with math
		TS_ASSERT(size.FromString("0 -100-10+100 20+200-200 -30"));
		TS_ASSERT_EQUALS(size, CGUISize(CRect(0, -10, 20, -30), CRect(0, 0, 0, 0)));

		// Test only percent
		TS_ASSERT(size.FromString("-5% 10.0% -20% 30.0%"));
		TS_ASSERT_EQUALS(size, CGUISize(CRect(0, 0, 0, 0), CRect(-5, 10, -20, 30)));

		// Test only percent, but with math
		TS_ASSERT(size.FromString("15%-5%-15% 10% -20% 30%+500%-500%"));
		TS_ASSERT_EQUALS(size, CGUISize(CRect(0, 0, 0, 0), CRect(-5, 10, -20, 30)));

		// Test mixed
		TS_ASSERT(size.FromString("5% -10 -20% 30"));
		TS_ASSERT_EQUALS(size, CGUISize(CRect(0, -10, 0, 30), CRect(5, 0, -20, 0)));

		// Test mixed with math
		TS_ASSERT(size.FromString("5%+10%-10% 30%-10-30% 50-20%-50 30-100+100"));
		TS_ASSERT_EQUALS(size, CGUISize(CRect(0, -10, 0, 30), CRect(5, 0, -20, 0)));

		// Test for fail with too many/few parameters
		TS_ASSERT(!size.FromString("10 20 30 40 50"));
		TS_ASSERT(!size.FromString("10 20 30"));

		// Test for fail with garbage data
		TS_ASSERT(!size.FromString("Hello world!"));
		TS_ASSERT(!size.FromString("abc 123 xyz 789"));
		TS_ASSERT(!size.FromString("300 wide, 400 high"));
	}

	void test_rect()
	{
		TestLogger nolog;
		CRect test;

		TS_ASSERT(CGUI::ParseString<CRect>(nullptr, CStrW(L"0.0 10.0 20.0 30.0"), test));
		TS_ASSERT_EQUALS(CRect(0.0, 10.0, 20.0, 30.0), test);

		TS_ASSERT(!CGUI::ParseString<CRect>(nullptr, CStrW(L"0 10 20"), test));
		TS_ASSERT(!CGUI::ParseString<CRect>(nullptr, CStrW(L"0 10 20 30 40"), test));
		TS_ASSERT(!CGUI::ParseString<CRect>(nullptr, CStrW(L"0,0 10,0 20,0 30,0"), test));
	}

	void test_size()
	{
		TestLogger nolog;
		CSize2D test;

		TS_ASSERT(CGUI::ParseString<CSize2D>(nullptr, CStrW(L"0.0 10.0"), test));
		TS_ASSERT_EQUALS(CSize2D(0.0, 10.0), test);

		TS_ASSERT(!CGUI::ParseString<CSize2D>(nullptr, CStrW(L"0"), test));
		TS_ASSERT(!CGUI::ParseString<CSize2D>(nullptr, CStrW(L"0 10 20"), test));
		TS_ASSERT(!CGUI::ParseString<CSize2D>(nullptr, CStrW(L"0,0 10,0"), test));
	}

	void test_pos()
	{
		TestLogger nolog;
		CVector2D test;

		TS_ASSERT(CGUI::ParseString<CVector2D>(nullptr, CStrW(L"0.0 10.0"), test));
		TS_ASSERT_EQUALS(CVector2D(0.0, 10.0), test);

		TS_ASSERT(!CGUI::ParseString<CVector2D>(nullptr, CStrW(L"0"), test));
		TS_ASSERT(!CGUI::ParseString<CVector2D>(nullptr, CStrW(L"0 10 20"), test));
		TS_ASSERT(!CGUI::ParseString<CVector2D>(nullptr, CStrW(L"0,0 10,0"), test));
	}

	void test_layout_sizing()
	{
		TestLogger nolog;
		CGUILayoutSizing test;

		TS_TRACE("Testing Fit no clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"fit"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::FIT, 0, 0, 0), test);

		TS_TRACE("Testing Fit with clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"fit(0,128)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::FIT, 0, 0, 128), test);

		TS_TRACE("Testing Fit with clamp and min");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"fit(32)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::FIT, 0, 32, 0), test);

		TS_TRACE("Testing Percentage no clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"80%"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::PERCENT, 80, 0, 0), test);

		TS_TRACE("Testing Percentage with clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"80%(10,300)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::PERCENT, 80, 10, 300), test);

		TS_TRACE("Testing Percentage with clamp and min");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"80%(300)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::PERCENT, 80, 300, 0), test);

		TS_TRACE("Testing grow no clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"grow"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::GROW, 0, 0, 0), test);

		TS_TRACE("Testing grow with clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"grow(10,300)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::GROW, 0, 10, 300), test);

		TS_TRACE("Testing grow with clamp and min");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"grow(32)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::GROW, 0, 32, 0), test);

		TS_TRACE("Testing shrink no clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"shrink"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::SHRINK, 0, 0, 0), test);

		TS_TRACE("Testing shrink with clamp");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"shrink(10,300)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::SHRINK, 0, 10, 300), test);

		TS_TRACE("Testing shrink with clamp and min");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"shrink(32)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::SHRINK, 0, 32, 0), test);

		TS_TRACE("Testing fixed");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"100"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::FIXED, 0, 100, 100), test);

		TS_TRACE("Testing clamp fit");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"clamp(20,fit,200)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::FIT, 0, 20, 200), test);

		TS_TRACE("Testing clamp percentage");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"clamp(20,50%,200)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::PERCENT, 50, 20, 200), test);

		TS_TRACE("Testing clamp grow");
		TS_ASSERT(CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"clamp(20,grow,200)"), test));
		TS_ASSERT_EQUALS(CGUILayoutSizing(LayoutSizingType::GROW, 0, 20, 200), test);

		TS_TRACE("Testing invalid input");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"fit,,(asd)"), test));

		TS_TRACE("Testing incomplete values");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"fit(10,20"), test));

		TS_TRACE("Testing fixed invalid input");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"fixed(10)"), test));

		TS_TRACE("Testing invalid clamp input");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutSizing>(nullptr, CStrW(L"clamp(10,20,30,40)"), test));
	}

	void test_layout_padding()
	{
		TestLogger nolog;
		CGUILayoutPadding test;

		TS_TRACE("Testing Padding with all values");
		TS_ASSERT(CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L"10 20 30 40"), test));
		TS_ASSERT_EQUALS(CGUILayoutPadding(10, 20, 30, 40), test);

		TS_TRACE("Testing padding with horizontal and vertical");
		TS_ASSERT(CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L"5 10"), test));
		TS_ASSERT_EQUALS(CGUILayoutPadding(5, 10, 5, 10), test);

		TS_TRACE("Testing paddin with one value");
		TS_ASSERT(CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L"6"), test));
		TS_ASSERT_EQUALS(CGUILayoutPadding(6), test);

		TS_TRACE("Testing padding with no values");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L""), test));

		TS_TRACE("Testing padding with negative value");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L"-10 -5 1 2"), test));

		TS_TRACE("Testing padding with invalid values");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L"10 20 30"), test));

		TS_TRACE("Testing padding with too many values");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L"10 20 30 40 50"), test));

		TS_TRACE("Testing padding with garbage data");
		TS_ASSERT(!CGUI::ParseString<CGUILayoutPadding>(nullptr, CStrW(L"Hello world!"), test));
	}
};
