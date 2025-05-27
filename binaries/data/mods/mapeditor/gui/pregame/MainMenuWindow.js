class MainMenuWindow extends BaseSetupWindow
{

}

MainMenuWindow.prototype.ClassSetupWindowPages.TitleSetup = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.title = Engine.GetGUIObjectByName("setupWindowTitle");
		this.title.caption = this.Caption;
	}
}
MainMenuWindow.prototype.ClassSetupWindowPages.TitleSetup.prototype.Caption = translate("Menu Options");

MainMenuWindow.prototype.ClassSetupWindowPages.ModButton = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.modButton = Engine.GetGUIObjectByName("modButton");
		this.modButton.caption = this.Caption;

		this.modButton.onPress = () => {
			Engine.SwitchGuiPage("page_modmod.xml", {
				"cancelbutton": true
			});
		}
	}
}
MainMenuWindow.prototype.ClassSetupWindowPages.ModButton.prototype.Caption = translate("Mods");

MainMenuWindow.prototype.ClassSetupWindowPages.EditorButton = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.editorButton = Engine.GetGUIObjectByName("editorButton");
		this.editorButton.caption = this.Caption;

		this.editorButton.onPress = () => {
			Engine.SwitchGuiPage("page_editorsetup.xml", {
				"cancelbutton": true
			});
		}
	}
}
MainMenuWindow.prototype.ClassSetupWindowPages.EditorButton.prototype.Caption = translate("Editor");
