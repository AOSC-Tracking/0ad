classEditorSettingControls.MapType = class extends EditorSettingControlDropdown
{
	constructor(...args)
	{
		super(...args);

		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;
			this.options = this.editorSettings.Helpers.MapTypes;

			this.dropdown.list = this.options.map(o => o.Title);
			this.dropdown.list_data = this.options.map(o => o.Name);

			this.editorSettings.editorData.watch(this.onEditorTypeChanged.bind(this), ["type"]);
			this.onEditorTypeChanged();
		});
	}

	onEditorTypeChanged()
	{
		this.setEnabled(this.editorSettings.editorData.type !== "new");
		this.setHidden(this.editorSettings.editorData.type === "new");
		this.render();
	}

	onHoverChange()
	{
		this.dropdown.tooltip = (this.options[this.dropdown.hovered] && this.options[this.dropdown.hovered].Description) || this.Tooltip;
	}

	render()
	{
		if (!this.enabled)
		{
			if (!this.hidden)
				this.setHidden(true);
			return;
		}

		this.setSelectedValue(this.editorSettings.mapType.mapType);
	}

	getAutocompleteEntries()
	{
		return this.options.map(o => o.Title);
	}

	onSelectionChange(itemIdx)
	{
		this.editorSettings.mapType.setMapType(this.options[itemIdx].Name);
	}
};

classEditorSettingControls.MapType.prototype.TitleCaption = translate("Map Type");
classEditorSettingControls.MapType.prototype.Tooltip = translate("Select a option.");
classEditorSettingControls.MapType.prototype.AutocompleteOrder = 0;
