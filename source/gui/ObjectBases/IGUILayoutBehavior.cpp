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

#include "IGUILayoutBehavior.h"

#include "gui/ObjectBases/IGUIObject.h"
#include "gui/CGUI.h"

IGUILayoutBehavior::IGUILayoutBehavior(IGUIObject& pObject)
	: m_pObject(pObject),
	m_LayoutDirection(&pObject, "layout_direction", LayoutDirection::LEFT_TO_RIGHT),
	m_LayoutWidth(&pObject, "layout_width", CGUILayoutSizing{LayoutSizingType::FIT, 0, 0, 0}),
	m_LayoutHeight(&pObject, "layout_height", CGUILayoutSizing{LayoutSizingType::FIT, 0, 0, 0}),
	m_ChildGap(&pObject, "child_gap", 0),
	m_LayoutPadding(&pObject, "layout_padding", CGUILayoutPadding{0}),
	m_LayoutXAlign(&pObject, "layout_align", EAlign::LEFT),
	m_LayoutYAlign(&pObject, "layout_valign", EVAlign::TOP),
	m_Sprite(&pObject, "sprite")
{
}

void IGUILayoutBehavior::CalculateLayout()
{
	const CSize2D size{m_pObject.GetGUI().GetWindowSize()};
	const int width{static_cast<int>(size.Width)};
	const int height{static_cast<int>(size.Height)};
	m_LayoutDirection.GetMutable() = LayoutDirection::LEFT_TO_RIGHT;
	m_LayoutWidth.GetMutable() = CGUILayoutSizing{LayoutSizingType::FIXED, 0, width, width};
	m_LayoutHeight.GetMutable() = CGUILayoutSizing{LayoutSizingType::FIXED, 0, height, height};
	m_LayoutPosition = CVector2D{0, 0};

	PrepareLayout();
	CalculateExtent<Axis::X>();
	CalculateGrowAndShrinkExtent<Axis::X>();
	CalculateExtent<Axis::Y>();
	CalculateGrowAndShrinkExtent<Axis::Y>();
	CalculatePosition();
}

void IGUILayoutBehavior::PrepareLayout()
{
	m_Children.clear();
	m_GrowWidthChildren.clear();
	m_GrowHeightChildren.clear();
	m_ShrinkWidthChildren.clear();
	m_ShrinkHeightChildren.clear();
	m_RemainingSize = CSize2D{0, 0};
	/*for (IGUIObject* child : m_pObject.GetChildren())
	{
		IGUILayoutBehavior* layoutBehavior{child->GetLayoutBehavior()};
		if (layoutBehavior == nullptr)
			continue;
		layoutBehavior->PrepareLayout();
		m_Children.push_back(layoutBehavior);
		if (layoutBehavior->m_LayoutWidth.GetMutable().GetType() == LayoutSizingType::GROW)
			m_GrowWidthChildren.push_back(layoutBehavior);
		else if (layoutBehavior->m_LayoutWidth.GetMutable().GetType() == LayoutSizingType::SHRINK)
			m_ShrinkWidthChildren.push_back(layoutBehavior);

		if (layoutBehavior->m_LayoutHeight.GetMutable().GetType() == LayoutSizingType::GROW)
			m_GrowHeightChildren.push_back(layoutBehavior);
		else if (layoutBehavior->m_LayoutHeight.GetMutable().GetType() == LayoutSizingType::SHRINK)
			m_ShrinkHeightChildren.push_back(layoutBehavior);
	}*/
}

void IGUILayoutBehavior::CalculatePosition()
{
	CVector2D tempPosition{m_LayoutPosition};
	tempPosition.X += m_LayoutPadding.GetMutable().GetLeft();
	tempPosition.Y += m_LayoutPadding.GetMutable().GetTop();
	for (IGUILayoutBehavior* layoutBehavior : m_Children)
	{
		layoutBehavior->m_LayoutPosition = tempPosition;

		if (m_LayoutDirection.GetMutable() == LayoutDirection::LEFT_TO_RIGHT)
		{
			if (layoutBehavior->m_LayoutYAlign.GetMutable() == EVAlign::BOTTOM)
				layoutBehavior->m_LayoutPosition.Y += m_LayoutSize.Height - layoutBehavior->m_LayoutSize.Height - m_LayoutPadding.GetMutable().GetHorizontal();
			else if (layoutBehavior->m_LayoutYAlign.GetMutable() == EVAlign::CENTER)
				layoutBehavior->m_LayoutPosition.Y += (m_LayoutSize.Height - layoutBehavior->m_LayoutSize.Height - m_LayoutPadding.GetMutable().GetVertical()) / 2;
		}
		else if (m_LayoutDirection.GetMutable() == LayoutDirection::TOP_TO_BOTTOM)
		{
			if (layoutBehavior->m_LayoutXAlign.GetMutable() == EAlign::RIGHT)
				layoutBehavior->m_LayoutPosition.X += m_LayoutSize.Width - layoutBehavior->m_LayoutSize.Width - m_LayoutPadding.GetMutable().GetVertical();
			else if (layoutBehavior->m_LayoutXAlign.GetMutable() == EAlign::CENTER)
				layoutBehavior->m_LayoutPosition.X += (m_LayoutSize.Width - layoutBehavior->m_LayoutSize.Width - m_LayoutPadding.GetMutable().GetHorizontal()) / 2;
		}

		layoutBehavior->CalculatePosition();

		if (m_LayoutDirection.GetMutable() == LayoutDirection::LEFT_TO_RIGHT)
		{
			tempPosition.X += layoutBehavior->m_LayoutSize.Width + m_ChildGap.GetMutable();
			continue;
		}

		tempPosition.Y += layoutBehavior->m_LayoutSize.Height + m_ChildGap.GetMutable();
	}
}

void IGUILayoutBehavior::Draw(CCanvas2D& canvas)
{
	if (m_LayoutSize == CSize2D{0, 0})
		return;
	CRect dimension{m_LayoutPosition, m_LayoutSize};
	m_pObject.GetGUI().DrawSprite(m_Sprite, canvas, dimension, dimension);
}

template<IGUILayoutBehavior::Axis A>
void IGUILayoutBehavior::CalculateExtent()
{
	using T = AxisTraits<A>;

	T::minSize(m_LayoutMinSize) = T::sizing(*this).GetMin();
	T::maxSize(m_LayoutMaxSize) = T::sizing(*this).GetMax();

	if (T::sizing(*this).GetType() == LayoutSizingType::FIXED)
		T::size(m_LayoutSize) = T::sizing(*this).GetMin();
	else
		T::size(m_LayoutSize) = 0;

	if (m_LayoutDirection.GetMutable() == T::flowDir())
	{
		int childGap{static_cast<int>(m_Children.size() - 1) * m_ChildGap.GetMutable()};
		T::size(m_LayoutSize) += childGap;
	}

	for (IGUILayoutBehavior* layoutBehavior : m_Children)
	{
		layoutBehavior->template CalculateExtent<A>();
		if (T::sizing(*this).GetType() == LayoutSizingType::FIXED)
			continue;

		if (m_LayoutDirection.GetMutable() == T::flowDir())
			T::size(m_LayoutSize) += T::size(layoutBehavior->m_LayoutSize);
		else
			T::size(m_LayoutSize) = std::max(T::size(m_LayoutSize), T::size(layoutBehavior->m_LayoutSize));
	}

	T::size(m_LayoutSize) += T::padding(m_LayoutPadding.GetMutable());
}

template<IGUILayoutBehavior::Axis A>
void IGUILayoutBehavior::CalculateGrowAndShrinkExtent()
{
	using T = AxisTraits<A>;

	float remainingAxis{T::size(m_LayoutSize) - T::padding(m_LayoutPadding.GetMutable())};

	if (m_LayoutDirection.GetMutable() == T::flowDir())
	{
		// Calculate the total width of all children that have a fixed size.
		for (IGUILayoutBehavior* layoutBehavior : m_Children)
			remainingAxis -= static_cast<int>(T::size(layoutBehavior->m_LayoutSize));

		remainingAxis -= static_cast<int>(m_Children.size() - 1) * m_ChildGap.GetMutable();

		// Grow.
		while (remainingAxis > 0)
		{
			if (T::growChildren(*this).empty())
				break;

			float smallestGrow{T::size(T::growChildren(*this).at(0)->m_LayoutSize)};
			float secondSmallestGrow{std::numeric_limits<float>::max()};
			float widthToAdd = remainingAxis;

			for (IGUILayoutBehavior* layoutBehavior : T::growChildren(*this))
			{
				if (T::size(layoutBehavior->m_LayoutSize) < smallestGrow)
				{
					secondSmallestGrow = smallestGrow;
					smallestGrow = T::size(layoutBehavior->m_LayoutSize);
				}

				if (T::size(layoutBehavior->m_LayoutSize) > smallestGrow)
				{
					secondSmallestGrow = std::min(secondSmallestGrow, T::size(layoutBehavior->m_LayoutSize));
					widthToAdd = secondSmallestGrow - smallestGrow;
				}
			}

			widthToAdd = std::min(widthToAdd, remainingAxis / T::growChildren(*this).size());

			for (IGUILayoutBehavior* layoutBehavior : T::growChildren(*this))
			{
				if (T::size(layoutBehavior->m_LayoutSize) == smallestGrow)
				{
					T::size(layoutBehavior->m_LayoutSize) += widthToAdd;
					remainingAxis -= widthToAdd;
				}
			}
		}

		T::remaining(m_RemainingSize) = remainingAxis;
	}
	else
	{
		for (IGUILayoutBehavior* layoutBehavior : T::growChildren(*this))
			T::size(layoutBehavior->m_LayoutSize) = remainingAxis;
	}

	for (IGUILayoutBehavior* layoutBehavior : m_Children)
		layoutBehavior->template CalculateGrowAndShrinkExtent<A>();
}
