EditorSetupWindow.prototype.ClassControls.EditorSettingsController = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;

		this.updateLayoutHandlers = new Set();
		this.settingsChangeHandlers = new Set();
		this.loadingChangeHandlers = new Set();
		this.settingsLoadedHandlers = new Set();
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

	canLaunchEditor()
	{
		// You can override this validation if you want
		return (
			(this.setupWindow.controls.editorSettings.editorData.type || "") !== "" &&
			(this.setupWindow.controls.editorSettings.mapType.mapType || "") !== "" &&
			(this.setupWindow.controls.editorSettings.map.map || "") !== ""
		);
	}

	launchEditor()
	{
		this.setupWindow.controls.editorSettings.pickRandomItems();
		let editorAttributes = this.getSettings();

		Engine.StartGame(editorAttributes, 1 , false);

		// Switch to the loading page right away,
		// the GUI will otherwise show the unrandomised settings.
		this.switchToLoadingPage(editorAttributes);
	}

	switchToLoadingPage(attributes)
	{
		Engine.SwitchGuiPage("page_editorloading.xml", {
			"attribs": attributes,
			"playerAssignments": {
				"local": {
					"name": "editor",
					"player": 1
				}
			}
		});
	}
}

EditorSetupWindow.prototype.ClassControls.EditorSettingsController.ORDER = 2;
