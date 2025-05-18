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

#ifndef INCLUDED_CGUISIZE
#define INCLUDED_CGUISIZE

#include "js/RootingAPI.h"
#include "maths/Rect.h"
#include "ps/CStrForward.h"
#include "scriptinterface/ScriptForward.h"

/**
 * This class represents a rectangle relative to a parent rectangle
 * The value can be initialized from a string or JS object.
 */
class CGUISize
{
public:
	MOVABLE(CGUISize);

	CGUISize();
	CGUISize(const CRect& pixel, const CRect& percent);
	CGUISize(const CGUISize& other) : CGUISize(other.pixel, other.percent) {};

	/**
	 * Create an instance that stretches to exactly the full size of its parent.
	 */
	static CGUISize Full();

	/// Pixel modifiers
	mutable CRect pixel;

	/// Percent modifiers
	mutable CRect percent;

	/**
	 * Get client area rectangle when the parent is given
	 */
	CRect GetSize(const CRect& parent) const;

	/**
	 * The value can be set from a string looking like:
	 *
	 * "0 0 100% 100%"
	 * "50%-10 50%-10 50%+10 50%+10"
	 *
	 * i.e. First percent modifier, then + or - and the pixel modifier.
	 * Although you can use just the percent or the pixel modifier. Notice
	 * though that the percent modifier must always be the first when
	 * both modifiers are inputted.
	 *
	 * @return true if success, otherwise size will remain unchanged.
	 */
	bool FromString(const CStr8& Value);

	bool operator==(const CGUISize& other) const
	{
		return pixel == other.pixel && percent == other.percent;
	}

	void ToJSVal(const ScriptRequest& rq, JS::MutableHandleValue ret) const;
	bool FromJSVal(const ScriptRequest& rq, JS::HandleValue v);

	/**
	 * Instantiate the custom object type "GUISize", assign the current pixel and percent modifiers to it and cache it.
	 */
	void CreateJSInstance(const ScriptRequest& rq) const;

	/**
	 * Update a single modifier after a property change on m_JSInstance.
	 * The GUI object owning this setting is not informed about this change, so enable the dirty flag.
	 */
	bool ModifyPropertyDirty(const CStr& propName, const float value) const;

	/**
	 * Set the dirty flag to false and returns its previous value.
 	 */
	bool MarkClean() const;

private:

	/**
	 * A flag stating whether the connected object and its children have already been refreshed after the latest changes.
	 * Used to prevent multiple updates within a single tick.
	 */
	mutable bool m_IsDirty;

	/**
	 * Cached instance of a custom object exposed to JS representing this setting.
	 * It's lazily initialized and propagates all property changes to here.
	 * @see JSI_GUISize
	 */
	mutable std::unique_ptr<JS::PersistentRootedObject> m_JSInstance;
};

#endif // INCLUDED_CGUISIZE
