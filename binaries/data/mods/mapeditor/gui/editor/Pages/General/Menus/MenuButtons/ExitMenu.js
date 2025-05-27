editorMenus.Menus.ExitMenu = class
{
	constructor(menu, button)
	{
		this.button = button;
		this.button.caption = this.Caption;
		this.setupWindow = menu.setupWindow;
	}

	onPress()
	{
		this.setupWindow.closePage();
	}
}

editorMenus.Menus.ExitMenu.ORDER = 1000;
editorMenus.Menus.ExitMenu.prototype.Caption = translate("Exit");
