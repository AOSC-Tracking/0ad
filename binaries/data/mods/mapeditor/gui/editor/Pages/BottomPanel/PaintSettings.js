EditorWindow.prototype.ClassSetupWindowPages.PaintSettings = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.paintSettingsGui = Engine.GetGUIObjectByName("paintSettings");
		this.texturePreview = Engine.GetGUIObjectByName("texturePreview");
		this.texturePreviewName = Engine.GetGUIObjectByName("texturePreviewName");
		this.terrainGroup = Engine.GetGUIObjectByName("terrainGroup");
		this.terrainBrowserContainer = new TerrainGridBrowser(Engine.GetGUIObjectByName("terrainBrowserContainer"));

		this.setupWindow.registerLoadHandler(()=> {
			this.guiController = this.setupWindow.controls.guiController;

			this.guiController.watch(()=> {
				this.paintSettingsGui.hidden = !this.guiController.paintSettingsIsOpen;
			}, ["paintSettingsIsOpen"]);

			this.guiController.watch(()=> {
				this.texturePreview.texture_name = this.guiController.currentTerrainTexture;
				this.texturePreviewName.caption = this.formatTextureName(this.guiController.currentTerrainTexture);
			}, ["currentTerrainTexture"]);


			this.texturePreview.texture_name = this.guiController.currentTerrainTexture;
			this.texturePreviewName.caption = this.formatTextureName(this.guiController.currentTerrainTexture);

			this.terrainBrowserContainer.registerSelectionChangeHandler(() => {
				let texture = this.terrainBrowserContainer.terrainList[this.terrainBrowserContainer.selected] || "";
				if (texture)
					this.guiController.currentTerrainTexture = texture;
			});

			let terrainGroup = MapEditor.GetTerrainGroups();
			this.terrainGroup.list_data = terrainGroup;
			this.terrainGroup.list = terrainGroup;

			this.terrainGroup.onSelectionChange = () => {
				let textureList = MapEditor.GetTerrainTextures(this.terrainGroup.list_data[this.terrainGroup.selected]);
				this.terrainBrowserContainer.updateTerrainList(textureList, this.texturePreview.texture_name);
			}

			this.terrainGroup.selected = 0;
		});
	}

	formatTextureName(name)
	{
		// replace underscores with spaces, and upper case the first letter
		return name.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
	}
}


