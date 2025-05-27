toolbarButtons.Toolbars.DefaultButton = class
{
	constructor(toolbar, button, icon)
	{
		this.button = button;
		this.setupWindow = toolbar.setupWindow;
		this.button.tooltip = this.Tooltip;
		icon.sprite = this.IconSprite;
	}

	onToogle(isToogle)
	{
		if (isToogle)
			this.setupWindow.controls.toolsAtlasController.changeState("idle");
	}
}

toolbarButtons.Toolbars.DefaultButton.prototype.IconSprite = "stretched:editor/toolbar/default.png";
toolbarButtons.Toolbars.DefaultButton.prototype.Tooltip = translate("Default");
