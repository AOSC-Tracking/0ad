GameSettings.prototype.Attributes.Wonder = class Wonder extends GameSetting
{
	init()
	{
		this.available = false;
		this.duration = 0;
		this.settings.victoryConditions.watch(() => this.maybeUpdate(), ["active"]);
		this.settings.map.watch(() => this.onMapChange(), ["map"]);
	}

	toInitAttributes(attribs)
	{
		if (this.available)
			attribs.settings.WonderDuration = this.duration;
	}

	fromInitAttributes(attribs)
	{
		if (this.getLegacySetting(attribs, "WonderDuration") !== undefined)
			this.setValue(+this.getLegacySetting(attribs, "WonderDuration"));
	}

	onMapChange()
	{
		if (this.settings.map.type != "scenario")
			return;
		this.setValue(+this.getMapSetting("WonderDuration") || 0);
	}

	setValue(duration)
	{
		this.available = this.settings.victoryConditions.active.has("wonder");
		this.duration = Math.round(duration);
	}

	maybeUpdate()
	{
		this.setValue(this.duration);
	}
};
