classEditorSettingControls.RandomBiome = class extends EditorSettingControlDropdown
{
	constructor(...args)
	{
		super(...args);
		this.biomes = g_Settings && g_Settings.Biomes;

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
		this.editorSettings.randomMap.setBiome(undefined);

		if (this.editorSettings.editorData.type !== "new" && this.editorSettings.mapType.mapType === "random")
		{
			if (this.editorSettings.map.map)
			{
				let mapData = this.mapEditorCache.getMapData(this.editorSettings.mapType.mapType, this.editorSettings.map.map);

				if (mapData && mapData.settings && mapData.settings.SupportedBiomes)
				{
					let fnFilter = (b) => {
						if (typeof mapData.settings.SupportedBiomes === "string")
							return b.Id.startsWith(mapData.settings.SupportedBiomes);
						return mapData.settings.SupportedBiomes.some(sb=> b.Id.indexOf(sb) !== -1);
					};
					this.dropValues = prepareForDropdown(this.biomes.filter(fnFilter));
					this.dropdown.list = this.dropValues.Title;
					this.dropdown.list_data = this.dropValues.Id;
					this.editorSettings.randomMap.setBiome(this.dropValues && this.dropValues.Id && this.dropValues.Id[0]);
				} else
					this.setHidden(true);
			}
		}

		this.render();
	}

	onHoverChange()
	{
		this.dropdown.tooltip = this.dropValues.Description[this.dropdown.hovered] || this.Tooltip;
	}

	getAutocompleteEntries()
	{
		return this.dropValues.Name;
	}

	onSelectionChange(itemIdx)
	{
		this.editorSettings.randomMap.setBiome(this.dropdown.list_data[itemIdx]);
	}

	render()
	{
		if (!this.enabled)
		{
			if (!this.hidden)
				this.setHidden(true);
			return;
		}

		this.setSelectedValue(this.editorSettings.randomMap.biome);
	}
}

classEditorSettingControls.RandomBiome.prototype.TitleCaption = translate("Biome");
classEditorSettingControls.RandomBiome.prototype.Tooltip = translate("Select the flora and fauna.");
classEditorSettingControls.RandomBiome.prototype.AutocompleteOrder = 0;
