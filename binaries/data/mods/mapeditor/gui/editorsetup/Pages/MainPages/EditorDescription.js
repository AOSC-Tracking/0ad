EditorSetupWindow.prototype.ClassSetupWindowPages.EditorDescriptionPage = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.editorDescription = Engine.GetGUIObjectByName("editorDescription");

		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;
			this.editorSettings.editorData.watch(this.updateEditorDescription.bind(this), ["type"]);
			this.editorSettings.mapType.watch(this.updateEditorDescription.bind(this), ["mapType"]);
			this.editorSettings.map.watch(this.updateEditorDescription.bind(this), ["map"]);

			this.updateEditorDescription();
		});
	}

	updateEditorDescription()
	{
		this.editorDescription.caption = this.getEditorDescription();
	}

	getEditorDescription()
	{
		const titles = [];
		const settings = this.editorSettings.toInitAttributes();

		if (settings.editorType)
		{
			titles.push(this.editorSettings.editorData.getTitleDescription());
		}

		if (settings.mapType)
		{
			titles.push(this.editorSettings.mapType.getTitleDescription());
		}

		if (settings.map)
		{
			titles.push(this.editorSettings.map.getTitleDescription());
		}

		return titles.map(title => sprintf(translate("%(label)s %(details)s"), {
			"label": coloredText(title.label, this.DescriptionHighlight),
			"details":
				title.value === true ? translateWithContext("game setup option", "enabled") :
					title.value || translateWithContext("game setup option", "disabled")
		})).join("\n");
	}
}

EditorSetupWindow.prototype.ClassSetupWindowPages.EditorDescriptionPage.prototype.DescriptionHighlight = "orange";
