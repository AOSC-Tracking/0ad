toolbarButtons.Toolbars.PaintTerrainButton = class
{
	constructor(toolbar, button, icon, index)
	{
		this.button = button;
		this.setupWindow = toolbar.setupWindow;
		this.button.tooltip = this.Tooltip;
		icon.sprite = this.IconSprite;

		this.index = index;
		this.toolName = "PaintTerrain";
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

toolbarButtons.Toolbars.PaintTerrainButton.ORDER = 5;
toolbarButtons.Toolbars.PaintTerrainButton.prototype.IconSprite = "stretched:editor/toolbar/paintterrain.png";
toolbarButtons.Toolbars.PaintTerrainButton.prototype.Tooltip = translate("Paint terrain texture");
