class EditorSetupWindow extends BaseSetupWindow {

}

EditorSetupWindow.prototype.ClassSetupWindowPages.TitleSetup = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.title = Engine.GetGUIObjectByName("setupWindowTitle");
		this.title.caption = this.Caption;
	}
}
EditorSetupWindow.prototype.ClassSetupWindowPages.TitleSetup.prototype.Caption = translate("Editor Setup");
