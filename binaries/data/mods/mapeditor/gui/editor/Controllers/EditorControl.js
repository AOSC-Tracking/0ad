EditorWindow.prototype.ClassControls.EditorSettingsController = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;

		this.updateLayoutHandlers = new Set();
		this.settingsChangeHandlers = new Set();
		this.loadingChangeHandlers = new Set();
		this.settingsLoadedHandlers = new Set();

		this.setupWindow.registerLoadHandler(() => {
			this.loadMapSettings();
		});
	}

	registerUpdateLayoutHandler(handler)
	{
		this.updateLayoutHandlers.add(handler);
	}

	registerSettingsChangeHandler(handler)
	{
		this.settingsChangeHandlers.add(handler);
	}

	registerLoadingChangeHandler(handler)
	{
		this.loadingChangeHandlers.add(handler);
	}

	registerSettingsLoadedHandler(handler)
	{
		this.settingsLoadedHandlers.add(handler);
	}

	onGetHotloadData(object)
	{
		object.initAttributes = this.getSettings();
	}

	getSettings()
	{
		let ret = this.setupWindow.controls.editorSettings.toInitAttributes();
		return ret;
	}

	parseSettings(settings)
	{
		this.setupWindow.controls.editorSettings.fromInitAttributes(settings);
	}

	updateLayout()
	{
		for (let handler of this.updateLayoutHandlers)
			handler();
	}

	loadMapSettings()
	{
		let currentSettings = MapEditor.GetMapSettings();
		this.parseSettings({
			settings: currentSettings
		});

		for (const handler of this.settingsLoadedHandlers)
			handler();

		this.updateLayout();

	}

	saveMapSettings()
	{
		let currentSettings = this.getSettings().settings;

		MapEditor.SetMapSettings(currentSettings);
	}
}

EditorWindow.prototype.ClassControls.EditorSettingsController.ORDER = 2;
