classEditorSettingControls.RandomSize = class extends EditorSettingControlDropdown
{
	constructor(...args)
	{
		super(...args);
		this.defaultPlayerData = g_Settings && g_Settings.PlayerDefaults;
		this.victoryConditions = [];
		this.dropValues = prepareForDropdown(g_Settings && g_Settings.MapSizes);
		this.dropdown.list = this.dropValues.Name;
		this.dropdown.list_data = this.dropValues.Tiles;

		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;
			this.mapEditorCache = this.setupWindow.controls.mapEditorCache;
			this.editorSettings.editorData.watch(this.onDependenciesChanged.bind(this), ["type"]);
			this.editorSettings.mapType.watch(this.onDependenciesChanged.bind(this), ["mapType"]);
			this.editorSettings.map.watch(this.onDependenciesChanged.bind(this), ["map"]);
			this.onDependenciesChanged();
		});
	}

	onDependenciesChanged()
	{
		this.setEnabled(this.editorSettings.editorData.type !== "new" && this.editorSettings.mapType.mapType === "random");
		this.setHidden(this.editorSettings.editorData.type === "new" || this.editorSettings.mapType.mapType !== "random" || !this.editorSettings.map.map);

		if (this.editorSettings.editorData.type === "new" || this.editorSettings.mapType.mapType !== "random")
			this.editorSettings.randomMap.setSize(undefined);
		else
		{
			if (this.editorSettings.map.map)
			{
				let mapData = this.mapEditorCache.getMapData(this.editorSettings.mapType.mapType, this.editorSettings.map.map);

				if (mapData && mapData.settings)
				{
					this.editorSettings.randomMap.setName(mapData.settings.Name);
					this.editorSettings.randomMap.setDescription(mapData.settings.Description);
					this.editorSettings.randomMap.setPreview(mapData.settings.Preview);
					this.editorSettings.randomMap.setCircularMap(mapData.settings.CircularMap);
					this.editorSettings.randomMap.setVictoryConditions(this.victoryConditions);
					this.editorSettings.randomMap.setPlayerData(this.defaultPlayerData.map(p=> {
						return {Civ: p.Civ};
					}));
					this.editorSettings.randomMap.setScript(mapData.settings.Script);
				}
			}
			this.editorSettings.randomMap.setSize(this.dropValues.Tiles[this.dropValues.Default] || this.dropValues.Tiles[0]);
		}
		this.render();
	}

	onHoverChange()
	{
		this.dropdown.tooltip = this.dropValues.Tooltip[this.dropdown.hovered] || this.Tooltip;
	}

	getAutocompleteEntries()
	{
		return this.dropValues.Name;
	}

	onSelectionChange(itemIdx)
	{
		this.editorSettings.randomMap.setSize(this.dropdown.list_data[itemIdx]);
	}

	render()
	{
		if (!this.enabled)
		{
			if (!this.hidden)
				this.setHidden(true);
			return;
		}

		this.setSelectedValue(this.editorSettings.randomMap.size);
	}
}

classEditorSettingControls.RandomSize.prototype.TitleCaption = translate("Map Size");
classEditorSettingControls.RandomSize.prototype.Tooltip = translate("Select map size. (Larger sizes may reduce performance.)");
classEditorSettingControls.RandomSize.prototype.AutocompleteOrder = 0;
