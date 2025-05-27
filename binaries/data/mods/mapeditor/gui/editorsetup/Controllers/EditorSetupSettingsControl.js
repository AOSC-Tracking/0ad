EditorSetupWindow.prototype.ClassControls.EditorSettings = class extends EditorSetupSettings
{
	constructor(setupWindow)
	{
		super();

		this.setupWindow = setupWindow;

		this.setupWindow.registerLoadHandler(() => {
			this.init(this.setupWindow.controls.mapEditorCache);
		});
	}
}

EditorSetupWindow.prototype.ClassControls.EditorSettings.ORDER = 1;
