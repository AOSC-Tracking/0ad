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

#ifndef INCLUDED_IGUILAYOUTBEHAVIOR
#define INCLUDED_IGUILAYOUTBEHAVIOR

#include "gui/CGUISetting.h"
#include "gui/CGUISprite.h"
#include "gui/GUIRenderer.h"
#include "gui/SettingTypes/CGUILayoutSizing.h"
#include "gui/SettingTypes/CGUILayoutPadding.h"
#include "gui/SettingTypes/EAlign.h"
#include "ps/CStr.h"
#include "maths/Size2D.h"
#include "maths/Vector2D.h"

#include <vector>

class IGUIObject;

class IGUILayoutBehavior
{
public:
	IGUILayoutBehavior(IGUIObject& pObject);
	~IGUILayoutBehavior() = default;
	NONCOPYABLE(IGUILayoutBehavior);

	enum class LayoutDirection {
		LEFT_TO_RIGHT,
		TOP_TO_BOTTOM,
	};

	CGUISimpleSetting<LayoutDirection> m_LayoutDirection;
	CGUISimpleSetting<CGUILayoutSizing> m_LayoutWidth;
	CGUISimpleSetting<CGUILayoutSizing> m_LayoutHeight;
	CGUISimpleSetting<int> m_ChildGap;
	CGUISimpleSetting<CGUILayoutPadding> m_LayoutPadding;
	CGUISimpleSetting<CGUISpriteInstance> m_Sprite;
	CGUISimpleSetting<EAlign> m_LayoutXAlign;
	CGUISimpleSetting<EVAlign> m_LayoutYAlign;

	void CalculateLayout();
	void Draw(CCanvas2D& canvas);

private:
	IGUIObject& m_pObject;
	CVector2D m_LayoutPosition{0,0};
	CSize2D m_LayoutSize{0,0};
	CSize2D m_LayoutMinSize{0,0};
	CSize2D m_LayoutMaxSize{0,0};
	CSize2D m_RemainingSize{0,0};

	std::vector<IGUILayoutBehavior*> m_Children;
	std::vector<IGUILayoutBehavior*> m_GrowWidthChildren;
	std::vector<IGUILayoutBehavior*> m_GrowHeightChildren;
	std::vector<IGUILayoutBehavior*> m_ShrinkWidthChildren;
	std::vector<IGUILayoutBehavior*> m_ShrinkHeightChildren;

private:
	enum class Axis {
		X, Y
	};

	template<Axis A>
	struct AxisTraits
	{
		static auto& size(CSize2D& s) { if constexpr (A == Axis::X) return s.Width; else return s.Height; }
		static auto& minSize(CSize2D& s) { if constexpr (A == Axis::X) return s.Width; else return s.Height; }
		static auto& maxSize(CSize2D& s) { if constexpr (A == Axis::X) return s.Width; else return s.Height; }

		static auto& remaining(CSize2D& s) { if constexpr (A == Axis::X) return s.Width; else return s.Height; }

		static int padding (const CGUILayoutPadding& padding)
		{
			return A == Axis::X ? padding.GetHorizontal() : padding.GetVertical();
		}

		static auto& sizing(IGUILayoutBehavior& layoutBehavior)
		{
			return (A == Axis::X) ? layoutBehavior.m_LayoutWidth.GetMutable()
				: layoutBehavior.m_LayoutHeight.GetMutable();
		}

		static std::vector<IGUILayoutBehavior*>& growChildren(IGUILayoutBehavior& layoutBehavior)
		{
			return (A == Axis::X) ? layoutBehavior.m_GrowWidthChildren : layoutBehavior.m_GrowHeightChildren;
		}

		static std::vector<IGUILayoutBehavior*>& shrinkChildren(IGUILayoutBehavior& layoutBehavior)
		{
			return (A == Axis::X) ? layoutBehavior.m_ShrinkWidthChildren : layoutBehavior.m_ShrinkHeightChildren;
		}

		static IGUILayoutBehavior::LayoutDirection flowDir()
		{
			return (A == Axis::X) ? IGUILayoutBehavior::LayoutDirection::LEFT_TO_RIGHT : IGUILayoutBehavior::LayoutDirection::TOP_TO_BOTTOM;
		}

		static EAlign crossAlign(IGUILayoutBehavior& layoutBehavior)
		{
			return layoutBehavior.m_LayoutXAlign.GetMutable();
		}

		static EVAlign crossVAlign(IGUILayoutBehavior& layoutBehavior)
		{
			return layoutBehavior.m_LayoutYAlign.GetMutable();
		}
	};
protected:
	void PrepareLayout();
	void CalculatePosition();

	template<Axis A> void CalculateExtent();
	template<Axis A> void CalculateGrowAndShrinkExtent();
};

#endif // !INCLUDED_IGUILAYOUTBEHAVIOR
