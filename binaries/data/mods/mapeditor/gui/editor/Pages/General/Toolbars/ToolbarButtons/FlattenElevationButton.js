toolbarButtons.Toolbars.FlattenElevationButton = class
{
	constructor(toolbar, button, icon, index)
	{
		this.button = button;
		this.setupWindow = toolbar.setupWindow;
		this.button.tooltip = this.Tooltip;
		icon.sprite = this.IconSprite;

		this.index = index;
		this.toolName = "FlattenElevation";
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

toolbarButtons.Toolbars.FlattenElevationButton.ORDER = 4;
toolbarButtons.Toolbars.FlattenElevationButton.prototype.IconSprite = "stretched:editor/toolbar/flattenelevation.png";
toolbarButtons.Toolbars.FlattenElevationButton.prototype.Tooltip = translate("Flatten terrain elevation");
