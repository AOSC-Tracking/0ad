function init(data)
{
	Engine.GetGUIObjectByName("mainText").caption = Engine.TranslateLines(Engine.ReadFile("gui/modmod/help/help.txt"));

	let buttons = [
		Engine.GetGUIObjectByName("closeButton"),
		Engine.GetGUIObjectByName("guideButton"),
		Engine.GetGUIObjectByName("visitButton")
	];
	distributeButtonsHorizontally(buttons);
}
