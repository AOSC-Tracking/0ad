classEditorSettingControls.Map = class extends EditorSettingControlDropdown
{
	constructor(...args)
	{
		super(...args);

		this.options = [];
		this.dropdown.tooltip =  this.Tooltip;
		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;

			this.editorSettings.editorData.watch(this.onDependenciesChanged.bind(this), ["type"]);
			this.editorSettings.mapType.watch(this.onDependenciesChanged.bind(this), ["mapType"]);
			this.mapTypes = this.editorSettings.mapType.MapTypes;
			this.onDependenciesChanged();
		});
	}

	onDependenciesChanged()
	{
		this.setEnabled(this.editorSettings.editorData.type !== "new");
		this.setHidden(this.editorSettings.editorData.type === "new");

		// we need to list maps from the current selection
		if (this.editorSettings.editorData.type !== "new" && this.editorSettings.mapType.mapType)
		{
			const mapTypeSelected = this.mapTypes.filter(mt => mt.Name === this.editorSettings.mapType.mapType)[0];
			const listMaps = Engine.ListDirectoryFiles(mapTypeSelected.Path, `*${mapTypeSelected.Suffix}`, true);
			const listMapsData = listMaps.filter(m => !m.endsWith("_default.xml") && !m.endsWith("_editor.xml")).map(m => m.replace(mapTypeSelected.Suffix, ""));
			this.dropdown.list = listMapsData;
			this.dropdown.list_data = listMapsData;
			this.editorSettings.map.setMap(null);
		}

		this.render();
	}

	render()
	{
		if (!this.enabled)
		{
			if (!this.hidden)
				this.setHidden(true);
			return;
		}

		this.setSelectedValue(this.editorSettings.map.map);
	}

	getAutocompleteEntries()
	{
		return this.options.map(o => o.Title);
	}

	onSelectionChange(itemIdx)
	{
		this.editorSettings.map.setMap(this.dropdown.list_data[itemIdx]);
	}
};

classEditorSettingControls.Map.prototype.TitleCaption = translate("Map");
classEditorSettingControls.Map.prototype.Tooltip = translate("Select a option.");
classEditorSettingControls.Map.prototype.AutocompleteOrder = 0;
