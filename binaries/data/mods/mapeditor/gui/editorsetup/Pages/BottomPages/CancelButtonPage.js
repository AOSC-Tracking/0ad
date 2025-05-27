EditorSetupWindow.prototype.ClassSetupWindowPages.CancelButtonPage = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.cancelButton = Engine.GetGUIObjectByName("cancelButton");
		this.cancelButton.caption = this.Caption;
		this.cancelButton.tooltip = this.Tooltip;
		this.cancelButton.onPress = setupWindow.closePage.bind(setupWindow);
	}
}

EditorSetupWindow.prototype.ClassSetupWindowPages.CancelButtonPage.prototype.Caption = translate("Back");
EditorSetupWindow.prototype.ClassSetupWindowPages.CancelButtonPage.prototype.Tooltip = translate("Return to the main menu.");
