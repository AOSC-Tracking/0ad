classEditorSettingControls.EditorType = class extends EditorSettingControlDropdown
{
	constructor(...args)
	{
		super(...args);

		this.editorMapDefault = this.EditorMapDefault;
		this.editorMapTypeDefault = this.EditorMapTypeDefault;

		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;
			this.options = this.editorSettings.editorData.EditorOptions;

			this.dropdown.list = this.options.map(o => o.Name);
			this.dropdown.list_data = this.options.map(o => o.Type);
			this.onSettingsLoaded();
		});
	}

	updatedEditorTypeSettings()
	{
		if (this.editorSettings.editorData.type === "new")
		{
			this.editorSettings.mapType.setMapType(this.editorMapTypeDefault);
			this.editorSettings.map.setMap(this.editorMapDefault);
		} else {
			this.editorSettings.mapType.setMapType(this.editorMapTypeDefault);
			this.editorSettings.map.setMap("");
		}
	}

	onSettingsLoaded()
	{
		if (!this.editorSettings.editorData.type)
		{
			const defaultOption = this.options.filter(o => o.Default);
			this.editorSettings.editorData.setType(defaultOption.length > 0 ? defaultOption[0].Type : this.options[0].Type);
		}

		this.updatedEditorTypeSettings();
		this.render();
	}

	onHoverChange()
	{
		this.dropdown.tooltip = (this.options[this.dropdown.hovered] && this.options[this.dropdown.hovered].Tooltip) || this.Tooltip;
	}

	render()
	{
		if (!this.enabled)
		{
			if (!this.hidden)
				this.setHidden(true);
			return;
		}

		this.setSelectedValue(this.editorSettings.editorData.type);
	}

	getAutocompleteEntries()
	{
		return this.options.map(o => o.Name);
	}

	onSelectionChange(itemIdx)
	{
		this.editorSettings.editorData.setType(this.options[itemIdx].Type);

		this.updatedEditorTypeSettings();
	}
};

classEditorSettingControls.EditorType.prototype.TitleCaption = translate("Editor Type");
classEditorSettingControls.EditorType.prototype.Tooltip = translate("Select a option.");
classEditorSettingControls.EditorType.prototype.EditorMapDefault = "maps/scenarios/_editor.xml";
classEditorSettingControls.EditorType.prototype.EditorMapTypeDefault = "scenario";
classEditorSettingControls.EditorType.prototype.AutocompleteOrder = 0;
