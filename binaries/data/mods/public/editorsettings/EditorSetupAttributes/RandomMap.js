EditorSetupSettings.prototype.Attributes.RandomMap = class extends EditorSetupSetting
{
	init()
	{
		this.script = "";
		this.biome = undefined;
		this.size = undefined;
		this.nomad = false;
		this.playerData = undefined;
		this.victoryConditions = undefined;
		this.name = undefined;
		this.description = undefined;
		this.preview = undefined;
		this.circularMap = undefined;
		this.playerPlacement = undefined;
	}

	toInitAttributes(attribs)
	{
		if (this.script)
		{
			attribs.script = this.script;
			attribs.settings = attribs.settings || {};
			if (this.biome)
				attribs.settings.Biome = this.biome;
			if (this.playerPlacement)
				attribs.settings.PlayerPlacement = this.playerPlacement;
			attribs.settings.Size = this.size;
			attribs.settings.Nomad = this.nomad;
			attribs.settings.PlayerData = this.playerData;
			attribs.settings.VictoryConditions = this.victoryConditions;
			attribs.settings.CircularMap = this.circularMap;
			attribs.settings.Name = this.name;
			attribs.settings.Description = this.description;
			attribs.settings.Preview = this.preview;
		}
	}

	fromInitAttributes(attribs)
	{
		if (attribs.script && attribs.settings)
		{
			this.script = attribs.script;
			this.setBiome(attribs.settings.Biome);
			this.setSize(attribs.settings.Size);
			this.setNomad(!!attribs.settings.Nomad);
			this.setPlayerData(attribs.settings.PlayerData);
			this.setVictoryConditions(attribs.settings.VictoryConditions);
			this.setCircularMap(!!attribs.settings.CircularMap);
			this.setName(attribs.settings.Name);
			this.setDescription(attribs.settings.Description);
			this.setPreview(attribs.settings.Preview);
			this.setPlayerPlacement(attribs.settings.PlayerPlacement);
		}

	}

	setNomad(value)
	{
		this.nomad = value;
	}

	setBiome(value)
	{
		this.biome = value;
	}

	setSize(value)
	{
		this.size = value;
	}

	setScript(value)
	{
		this.script = value;
	}

	setPlayerData(value)
	{
		this.playerData = value;
	}

	setVictoryConditions(value)
	{
		this.victoryConditions = value;
	}

	setName(value)
	{
		this.name = value;
	}

	setDescription(value)
	{
		this.description = value;
	}

	setPreview(value)
	{
		this.preview = value;
	}

	setCircularMap(value)
	{
		this.circularMap = value;
	}

	setPlayerPlacement(value)
	{
		this.playerPlacement = value;
	}
}
