classEditorSettingControls.RandomNomad = class extends EditorSettingControlCheckbox
{
	constructor(...args)
	{
		super(...args);
		this.setupWindow.registerLoadHandler(() => {
			this.editorSettings = this.setupWindow.controls.editorSettings;
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
			this.editorSettings.randomMap.setNomad(undefined);
		else
			this.editorSettings.randomMap.setNomad(false);

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

		this.setChecked(this.editorSettings.randomMap.nomad);
	}

	onPress(checked)
	{
		this.editorSettings.randomMap.setNomad(checked);
	}
}

classEditorSettingControls.RandomNomad.prototype.TitleCaption = translate("Nomad");
classEditorSettingControls.RandomNomad.prototype.Tooltip =
	translate("In Nomad mode, players start with only few units and have to find a suitable place to build their city. Ceasefire is recommended.");
