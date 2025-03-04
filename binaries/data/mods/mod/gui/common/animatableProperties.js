/**
 * @file Define which properties can be animated and the necessary methods for them.
 * TODO: Add support for animating the actual sprites / textures.
 */

/**
 * This property has to be passed in the following form:
 * { "r": 140, "g": 140, "b": 140, "a": 28} or { "r": 140, "g": 140, "b": 140}
 */
AnimationManager.prototype.animatableProperties.color = {
	"values": deepfreeze(["r", "g", "b", "a"]),
	"roundToIntegers": true,
	"get": (guiObject) => guiToRgbColor(guiObject.sprite.split(":")[1]),
	"set": (guiObject, color) => guiObject.sprite = "color:" + rgbToGuiColor(color, color.a ?? 255)
};

/**
 * This property has to be passed in the following form:
 * { "r": 140, "g": 140, "b": 140, "a": 28} or { "r": 140, "g": 140, "b": 140}
 */
AnimationManager.prototype.animatableProperties.textcolor = {
	"values": deepfreeze(["r", "g", "b", "a"]),
	"roundToIntegers": true,
	"get": (guiObject) => guiToRgbColor(guiObject.textcolor),
	"set": (guiObject, color) => guiObject.textcolor = rgbToGuiColor(color, color.a ?? 255)
};

/**
 * This property has to be parsed in the following form:
 *      {
 *			"left" : 0, "top" : 10, "right" : 250, "bottom" : 300,
 *			"rleft": 50, "rtop": 50, "rright": 50, "rbottom": 100,
 *		}
 */
AnimationManager.prototype.animatableProperties.size = {
	"values": deepfreeze(["left", "top", "right", "bottom", "rleft", "rtop", "rright", "rbottom"]),
	"roundToIntegers": false,
    "get": guiObject => guiObject.size,
    "set": (guiObject, size) => guiObject.size = new GUISize(
		size.left, size.top, size.right, size.bottom, size.rleft, size.rtop, size.rright, size.rbottom
	)
};
