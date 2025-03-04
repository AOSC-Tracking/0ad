/**
 * Used to highlight hotkeys in tooltip descriptions.
 */
var g_HotkeyTags = { "color": "255 251 131" };

function colorizeHotkey(text, hotkey)
{
	// TODO: Be more efficient in retrieving the mapping(s) for a specific hotkey
	let key = Engine.GetHotkeyMap()[hotkey];

	if (!key)
		key = sprintf(translate("Unassigned hotkey: %(hotkeyName)s"), {
			"hotkeyName": hotkey
		});
	else
		key = formatHotkeyCombinations(key);

	return sprintf(text, {
		"hotkey": setStringTags("\\[" + key + "]", g_HotkeyTags)
	});
}

/**
 * The autocomplete hotkey is hardcoded in SDLK_TAB of CInput.cpp,
 * as we don't want hotkeys interfering with typing text.
 */
function colorizeAutocompleteHotkey(string)
{
	return sprintf(string || translate("Press %(hotkey)s to autocomplete player names."), {
		"hotkey":
			setStringTags("\\[" + translateWithContext("hotkey", "Tab") + "]", g_HotkeyTags)
	});
}
