EditorSetupWindow.prototype.ClassSetupWindowPages.MapPReviewPage = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.mapInfoName = Engine.GetGUIObjectByName("mapInfoName");
		this.mapPreview = Engine.GetGUIObjectByName("mapPreview");

		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;
			this.mapEditorCache = this.setupWindow.controls.mapEditorCache;

			this.editorSettings.map.watch(() => this.render(), ["map"]);
			this.render();
		});
	}

	render()
	{
		if (!this.editorSettings.map.map)
			this.mapInfoName.caption = translate("No selected map");
		else
			this.mapInfoName.caption = this.mapEditorCache.translateMapName(
				this.mapEditorCache.getTranslatableMapName(this.editorSettings.mapType.mapType , this.editorSettings.map.map)
			);

		this.mapPreview.sprite = this.mapEditorCache.getMapPreview(this.editorSettings.mapType.mapType , this.editorSettings.map.map);
	}
}
