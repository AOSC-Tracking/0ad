editorMenus.Menus.SaveMenu = class
{
	constructor(menu, button)
	{
		this.button = button;
		this.button.caption = this.Caption;
		this.setupWindow = menu.setupWindow;
	}

	onPress()
	{
		this.setupWindow.controls.guiController.saveSettingsIsOpen = true
	}
}

editorMenus.Menus.SaveMenu.ORDER = 999;
editorMenus.Menus.SaveMenu.prototype.Caption = translateWithContext("Map Editor", "Save");
