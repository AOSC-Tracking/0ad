function init(data)
{
	Engine.GetGUIObjectByName("mainText").caption = Engine.TranslateLines(Engine.ReadFile("gui/modmod/help/help.txt"));

	distributeButtonsHorizontally([
		Engine.GetGUIObjectByName("closeButton"),
		Engine.GetGUIObjectByName("guideButton"),
		Engine.GetGUIObjectByName("visitButton")
	]);
}
