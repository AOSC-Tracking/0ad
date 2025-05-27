editorMenus.Menus.SettingsMenuButton = class
{
	constructor(menu, button)
	{
		this.button = button;
		this.button.caption = this.Caption;
		this.setupWindow = menu.setupWindow;
	}

	onPress()
	{
		this.setupWindow.controls.guiController.mapSettingsIsOpen = true
	}
}

editorMenus.Menus.SettingsMenuButton.ORDER = 1;
editorMenus.Menus.SettingsMenuButton.prototype.Caption = translate("Settings");
