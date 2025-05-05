GameSettings.prototype.Attributes.RelicCount = class extends GameSetting
{
	available = false;
	value = 1;

	init()
	{
		this.settings.victoryConditions.watch(this.maybeUpdate.bind(this), ["active"]);
		this.settings.map.watch(this.onMapChange.bind(this), ["map"]);
	}

	toInitAttributes(attribs)
	{
		// For consistency, only save this if the victory condition is active.
		if (this.available)
			attribs.settings.RelicCount = this.value;
	}

	fromInitAttributes(attribs)
	{
		const val = this.getLegacySetting(attribs, "RelicCount");
		if (val)
			this.setValue(val);
	}

	onMapChange()
	{
		if (this.settings.map.type != "scenario")
			return;
		// TODO: probably should sync the victory condition.
		if (!this.getMapSetting("RelicCount"))
			this.available = false;
		else
			this.setValue(+this.getMapSetting("RelicCount"));
	}

	setValue(val)
	{
		this.maybeUpdate();
		this.value = Math.max(Math.round(val), 1);
	}

	maybeUpdate()
	{
		this.available = this.settings.victoryConditions.active.has("capture_the_relic");
	}
};
