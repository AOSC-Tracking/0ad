EditorSetupWindow.prototype.ClassSetupWindowPages.EditorSettingsPanel = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.settingsPanelFrame = Engine.GetGUIObjectByName("settingsPanelFrame");
		this.settingsPanel = Engine.GetGUIObjectByName("settingsPanel");
		this.settingsPanelFrame.onWindowResized = this.onWindowResized.bind(this);

		this.setupWindow.registerLoadHandler(() => {
			this.editorSettingsControllerManager = this.setupWindow.controls.editorSettingsControllerManager;
			this.setupWindow.controls.editorSettingsController.registerUpdateLayoutHandler(this.updateSize.bind(this));

			this.updateSize();
		});
	}

	onWindowResized()
	{
		this.updateSize();
		this.positionSettings();
	}

	updateSize()
	{
		this.editorSettingsControllerManager.updateSettingVisibility();
		this.positionSettings();
	}

	positionSettings()
	{
		const settingsPanelSize = this.settingsPanel.getComputedSize();
		let yPos = this.SettingMarginBottom;
		for (let name of this.SettingOptions)
		{
			const settingFrame = this.editorSettingsControllerManager.editorSettingControls[name].frame;
			if (settingFrame.hidden)
				continue;

			settingFrame. size = new GUISize(
				this.SettingMarginLeft,
				yPos,
				(settingsPanelSize.right - settingsPanelSize.left) - this.SettingMarginRight,
				yPos + this.SettingHeight
			);

			yPos += this.SettingHeight + this.SettingMarginBottom;
		}
	}
}

EditorSetupWindow.prototype.ClassSetupWindowPages.EditorSettingsPanel.prototype.SettingMarginLeft = 16;
EditorSetupWindow.prototype.ClassSetupWindowPages.EditorSettingsPanel.prototype.SettingMarginRight = 16;
EditorSetupWindow.prototype.ClassSetupWindowPages.EditorSettingsPanel.prototype.SettingMarginBottom = 4;
EditorSetupWindow.prototype.ClassSetupWindowPages.EditorSettingsPanel.prototype.SettingHeight = 36;
EditorSetupWindow.prototype.ClassSetupWindowPages.EditorSettingsPanel.prototype.SettingOptions = [
	"EditorType",
	"MapType",
	"Map"
];
