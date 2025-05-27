toolbarButtons.Toolbars.SmoothElevationButton = class
{
	constructor(toolbar, button, icon, index)
	{
		this.button = button;
		this.setupWindow = toolbar.setupWindow;
		this.button.tooltip = this.Tooltip;
		icon.sprite = this.IconSprite;

		this.index = index;
		this.toolName = "SmoothElevation";
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

toolbarButtons.Toolbars.SmoothElevationButton.ORDER = 3;
toolbarButtons.Toolbars.SmoothElevationButton.prototype.IconSprite = "stretched:editor/toolbar/smoothelevation.png";
toolbarButtons.Toolbars.SmoothElevationButton.prototype.Tooltip = translate("Smooth terrain elevation");
