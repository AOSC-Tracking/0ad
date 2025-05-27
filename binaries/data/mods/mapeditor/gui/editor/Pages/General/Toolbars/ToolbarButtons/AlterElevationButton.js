toolbarButtons.Toolbars.AlterElevationButton = class
{
	constructor(toolbar, button, icon, index)
	{
		this.button = button;
		this.setupWindow = toolbar.setupWindow;
		this.button.tooltip = this.Tooltip;
		icon.sprite = this.IconSprite;

		this.index = index;
		this.toolName = "AlterElevation";
		this.isToogle = false;

		this.setupWindow.controls.brushSettings.watch(()=> {
			if (this.isToogle && this.setupWindow.controls.brushSettings.tool !== this.toolName)
				toolbar.updateToogleWithoutEvent(this.index, this.isToogle = false);
		}, ["tool"]);
	}

	onToogle(isToogle)
	{
		this.setupWindow.controls.brushSettings.tool = isToogle ? this.toolName : "";
		this.isToogle = isToogle;
	}
}

toolbarButtons.Toolbars.AlterElevationButton.ORDER = 2;
toolbarButtons.Toolbars.AlterElevationButton.prototype.IconSprite = "stretched:editor/toolbar/alterelevation.png";
toolbarButtons.Toolbars.AlterElevationButton.prototype.Tooltip = translate("Alter terrain elevation");
