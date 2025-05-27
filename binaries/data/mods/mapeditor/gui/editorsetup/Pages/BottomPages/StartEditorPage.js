EditorSetupWindow.prototype.ClassSetupWindowPages.StartButtonPage = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.startEditorButton = Engine.GetGUIObjectByName("startEditorButton");
		this.startEditorButton.caption = this.Caption;
		this.startEditorButton.tooltip = this.Tooltip;
		this.startEditorButton.enabled = false;

		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;

			this.editorSettings.editorData.watch(this.updateStartEditorButtonStatus.bind(this), ["type"]);
			this.editorSettings.mapType.watch(this.updateStartEditorButtonStatus.bind(this), ["mapType"]);
			this.editorSettings.map.watch(this.updateStartEditorButtonStatus.bind(this), ["map"]);

			this.startEditorButton.onPress = () => this.setupWindow.controls.editorSettingsController.launchEditor();
			this.updateStartEditorButtonStatus();
		});
	}

	updateStartEditorButtonStatus()
	{
		this.startEditorButton.enabled = this.setupWindow.controls.editorSettingsController.canLaunchEditor();
	}
}

EditorSetupWindow.prototype.ClassSetupWindowPages.StartButtonPage.prototype.Caption = translate("Start Editor!");
EditorSetupWindow.prototype.ClassSetupWindowPages.StartButtonPage.prototype.Tooltip = translate("Start a new editor with the current settings.");
