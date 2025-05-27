classEditorSettingControls.RandomPlayerPlacement = class extends EditorSettingControlDropdown
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
		this.editorSettings.randomMap.setPlayerPlacement(undefined);

		if (this.editorSettings.editorData.type !== "new" && this.editorSettings.mapType.mapType === "random")
		{
			if (this.editorSettings.map.map)
			{
				let mapData = this.mapEditorCache.getMapData(this.editorSettings.mapType.mapType, this.editorSettings.map.map);

				if (mapData && mapData.settings && mapData.settings.PlayerPlacements && mapData.settings.PlayerPlacements.length > 0)
				{
					this.dropdown.list = mapData.settings.PlayerPlacements;
					this.dropdown.list_data = mapData.settings.PlayerPlacements;
					this.editorSettings.randomMap.setPlayerPlacement(mapData.settings.PlayerPlacements[0]);
				} else
					this.setHidden(true);
			}
		}

		this.render();
	}

	onSelectionChange(itemIdx)
	{
		this.editorSettings.randomMap.setPlayerPlacement(this.dropdown.list_data[itemIdx]);
	}

	render()
	{
		if (!this.enabled)
		{
			if (!this.hidden)
				this.setHidden(true);
			return;
		}

		this.setSelectedValue(this.editorSettings.randomMap.playerPlacement);
	}
}

classEditorSettingControls.RandomPlayerPlacement.prototype.TitleCaption = translate("Player Placement");
classEditorSettingControls.RandomPlayerPlacement.prototype.Tooltip = translate("Select player placement.");
classEditorSettingControls.RandomPlayerPlacement.prototype.AutocompleteOrder = 0;
