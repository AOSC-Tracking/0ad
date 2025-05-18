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

#include "JSInterface_GUISize.h"

#include "ps/CStr.h"
#include "scriptinterface/ScriptInterface.h"
#include "scriptinterface/Object.h"

JSClass JSI_GUISize::JSI_class = {
	"GUISize", JSCLASS_HAS_RESERVED_SLOTS(SLOT_COUNT) , &JSI_GUISize::JSI_classops
};

JSClassOps JSI_GUISize::JSI_classops = {
	nullptr, nullptr,
	nullptr, nullptr,
	nullptr, nullptr, nullptr,
	nullptr, JSI_GUISize::construct, nullptr
};

#define GETTER(propName, propSlot) \
+[](JSContext* cx, uint argc, JS::Value* vp) -> bool { \
	if (!JSI_GUISize::getProperty(cx, argc, propSlot, vp)) \
	{ \
		LOGERROR("Failed to get property '%s' of GUISize instance.", propName); \
		return false; \
	} \
	return true; \
}
#define SETTER(propName, propSlot) \
+[](JSContext* cx, uint argc, JS::Value* vp) -> bool { \
	if (!JSI_GUISize::setProperty(cx, argc, propSlot, propName, vp)) \
	{ \
		LOGERROR("Failed to set property '%s' on GUISize instance.", propName); \
		return false; \
	} \
	return true; \
}
#define PROPERTY(propName, propSlot) JS_PSGS(propName, GETTER(propName, propSlot), SETTER(propName, propSlot), JSPROP_ENUMERATE)

JSPropertySpec JSI_GUISize::JSI_props[] = {
	PROPERTY("left", PROPERTY_SLOT_LEFT),
	PROPERTY("top", PROPERTY_SLOT_TOP),
	PROPERTY("right", PROPERTY_SLOT_RIGHT),
	PROPERTY("bottom", PROPERTY_SLOT_BOTTOM),
	PROPERTY("rleft", PROPERTY_SLOT_RLEFT),
	PROPERTY("rtop", PROPERTY_SLOT_RTOP),
	PROPERTY("rright", PROPERTY_SLOT_RRIGHT),
	PROPERTY("rbottom", PROPERTY_SLOT_RBOTTOM),
	JS_PS_END
};

#undef PROPERTY
#undef GETTER
#undef SETTER


JSFunctionSpec JSI_GUISize::JSI_methods[] =
{
	JS_FN("toString", JSI_GUISize::toString, 0, 0),
	JS_FS_END
};

void JSI_GUISize::RegisterScriptClass(ScriptInterface& scriptInterface)
{
	scriptInterface.DefineCustomObjectType(&JSI_GUISize::JSI_class, JSI_GUISize::construct, 0, JSI_GUISize::JSI_props, JSI_GUISize::JSI_methods, nullptr, nullptr);
}

bool JSI_GUISize::construct(JSContext* cx, uint argc, JS::Value* vp)
{
	JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
	ScriptRequest rq(cx);
	const ScriptInterface& scriptInterface = rq.GetScriptInterface();

	JS::RootedObject obj(rq.cx, scriptInterface.CreateCustomObject("GUISize"));

	if (args.length() == 8)
	{
		JS_SetProperty(rq.cx, obj, "left",		args[0]);
		JS_SetProperty(rq.cx, obj, "top",		args[1]);
		JS_SetProperty(rq.cx, obj, "right",	args[2]);
		JS_SetProperty(rq.cx, obj, "bottom",	args[3]);
		JS_SetProperty(rq.cx, obj, "rleft",	args[4]);
		JS_SetProperty(rq.cx, obj, "rtop",		args[5]);
		JS_SetProperty(rq.cx, obj, "rright",	args[6]);
		JS_SetProperty(rq.cx, obj, "rbottom",	args[7]);
	}
	else if (args.length() == 4)
	{
		JS::RootedValue zero(rq.cx, JS::NumberValue(0));
		JS_SetProperty(rq.cx, obj, "left",		args[0]);
		JS_SetProperty(rq.cx, obj, "top",		args[1]);
		JS_SetProperty(rq.cx, obj, "right",	args[2]);
		JS_SetProperty(rq.cx, obj, "bottom",	args[3]);
		JS_SetProperty(rq.cx, obj, "rleft",	zero);
		JS_SetProperty(rq.cx, obj, "rtop",		zero);
		JS_SetProperty(rq.cx, obj, "rright",	zero);
		JS_SetProperty(rq.cx, obj, "rbottom",	zero);
	}
	else
	{
		JS::RootedValue zero(rq.cx, JS::NumberValue(0));
		JS_SetProperty(rq.cx, obj, "left",		zero);
		JS_SetProperty(rq.cx, obj, "top",		zero);
		JS_SetProperty(rq.cx, obj, "right",	zero);
		JS_SetProperty(rq.cx, obj, "bottom",	zero);
		JS_SetProperty(rq.cx, obj, "rleft",	zero);
		JS_SetProperty(rq.cx, obj, "rtop",		zero);
		JS_SetProperty(rq.cx, obj, "rright",	zero);
		JS_SetProperty(rq.cx, obj, "rbottom",	zero);
	}

	args.rval().setObject(*obj);
	return true;
}

bool JSI_GUISize::setProperty(JSContext* cx, uint argc, ReservedSlot propSlot, CStr propName, JS::Value* vp)
{
	JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
	args.rval().setUndefined();
	if (args.length() != 1)
		return false;

	JS::RootedObject obj(cx, &args.thisv().toObject());

	ScriptRequest rq(cx);
	double val;
	if (!Script::FromJSVal(rq, args[0], val))
		return false;

	JS::SetReservedSlot(obj, propSlot, JS::RootedValue(cx, JS::NumberValue(val)));

	// Instances can be created via the constructor directly and exist independently from GUI objects.
	// In that case we're already done.
	// Otherwise, we have to forward the change to the size setting it is assigned to.
	CGUISize* owner = JS::GetMaybePtrFromReservedSlot<CGUISize>(obj, OWNER_SLOT);
	if (owner == nullptr)
		return true;

	return owner->ModifyPropertyDirty(propName, val);
}

bool JSI_GUISize::getProperty(JSContext* cx, uint argc, ReservedSlot propSlot, JS::Value* vp)
{
	if (propSlot == OWNER_SLOT || propSlot == SLOT_COUNT)
		return false;

	JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
	JS::RootedObject obj(cx, &args.thisv().toObject());;
	JS::RootedValue val(cx, JS::GetReservedSlot(obj, propSlot));
	if (!val.isNumber())
		return false;

	args.rval().set(val);
	return true;
}

// Produces "10", "-10", "50%", "50%-10", "50%+10", etc
CStr JSI_GUISize::ToPercentString(double pix, double per)
{
	if (per == 0)
		return CStr::FromDouble(pix);

	return CStr::FromDouble(per)+"%"+(pix == 0.0 ? CStr() : pix > 0.0 ? CStr("+")+CStr::FromDouble(pix) : CStr::FromDouble(pix));
}

bool JSI_GUISize::toString(JSContext* cx, uint argc, JS::Value* vp)
{
	JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
	CStr buffer;

	ScriptRequest rq(cx);
	double val, valr;

#define SIDE(side) \
	Script::GetProperty(rq, args.thisv(), #side, val); \
	Script::GetProperty(rq, args.thisv(), "r"#side, valr); \
	buffer += ToPercentString(val, valr);

	SIDE(left);
	buffer += " ";
	SIDE(top);
	buffer += " ";
	SIDE(right);
	buffer += " ";
	SIDE(bottom);
#undef SIDE

	Script::ToJSVal(rq, args.rval(), buffer);
	return true;
}
