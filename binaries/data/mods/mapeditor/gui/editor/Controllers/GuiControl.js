EditorWindow.prototype.ClassControls.GuiController = class extends ObservableSetting
{
	constructor(setupWindow)
	{
		super();
		this.setupWindow = setupWindow;

		this.mapSettingsIsOpen = false;
		this.mapChange = false;
		this.saveSettingsIsOpen = false;
		this.currentTerrainTexture = this.DefaultTerrainTexture;
		this.paintSettingsIsOpen = false;
		this.brushSettingsIsOpen = false;
		this.objectSettingsIsOpen =false;
		this.currentState = "";
	}
}

EditorWindow.prototype.ClassControls.GuiController.prototype.DefaultTerrainTexture = "editor";
