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

#ifndef INCLUDED_JSI_GUISIZE
#define INCLUDED_JSI_GUISIZE

#include "ps/CStr.h"
#include "scriptinterface/ScriptForward.h"
#include "scriptinterface/ScriptTypes.h"

namespace JSI_GUISize
{
	extern JSClass JSI_class;
	extern JSClassOps JSI_classops;
	extern JSPropertySpec JSI_props[];
	extern JSFunctionSpec JSI_methods[];


	enum ReservedSlot {
	 	// In order to use custom getters and setters, we store properties in reserved slots.
		PROPERTY_SLOT_LEFT,
		PROPERTY_SLOT_TOP,
		PROPERTY_SLOT_RIGHT,
		PROPERTY_SLOT_BOTTOM,
		PROPERTY_SLOT_RLEFT,
		PROPERTY_SLOT_RTOP,
		PROPERTY_SLOT_RRIGHT,
		PROPERTY_SLOT_RBOTTOM,
		OWNER_SLOT, // Contains a pointer to the underlying CGUISize instance if the object is attached to a GUI object.
		SLOT_COUNT
	};

	void RegisterScriptClass(ScriptInterface& scriptInterface);

	/**
	 * Create a new instance from 0, 4 (left, top, right, bottom) or 8 (all) arguments.
	 * This lets JS construct new, standalone objects not attached to any GUI object (with "new GUISize(_)").
	 */
	bool construct(JSContext* cx, uint argc, JS::Value* vp);

	/**
	 * Create a size string of the form "%rleft+left %rtop+top %rright+right %rbottom+bottom" from the current set of properties.
	 * Example: "10%+250 5 90%-250 100%-5"
	 * Useful for debugging.
	 * @see CGUISize::FromString
	 */
	bool toString(JSContext* cx, uint argc, JS::Value* vp);

	/**
	 * Update the value in the reserved slot and forward the change to the underlying CGUISize instance (if any).
	 */
	bool setProperty(JSContext* cx, uint argc, ReservedSlot propSlot, CStr propName, JS::Value* vp);

	/**
	 * Retrieve a property from a reserved slot.
	 */
	bool getProperty(JSContext* cx, uint argc, ReservedSlot propSlot, JS::Value* vp);;

	/**
	 * Create the percent string for a single side from the absolute and relative values.
	 */
	CStr ToPercentString(double pix, double per);
}

#endif // INCLUDED_JSI_GUISIZE
