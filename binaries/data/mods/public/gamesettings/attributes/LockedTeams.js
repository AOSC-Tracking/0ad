GameSettings.prototype.Attributes.LockedTeams = class LockedTeams extends GameSetting
{
	init()
	{
		this.enabled = false;
		this.settings.map.watch(() => this.onMapChange(), ["map"]);
		this.settings.rating.watch(() => this.onRatingChange(), ["enabled"]);
		this.settings.population.watch(() => this.onPopCapTypeChange(), ["capType"]);
		this.onRatingChange();
	}

	toInitAttributes(attribs)
	{
		attribs.settings.LockTeams = this.enabled;
	}

	fromInitAttributes(attribs)
	{
		this.enabled = !!this.getLegacySetting(attribs, "LockTeams");
	}

	onMapChange()
	{
		if (this.settings.map.type != "scenario")
			return;
		this.setAvailable(!!this.getMapSetting("LockTeams"));
	}

	onRatingChange()
	{
		this.setAvailable(!this.settings.rating.enabled);
	}

	onPopCapTypeChange()
	{
		this.setAvailable(this.settings.population.capType != "team");
	}

	setAvailable(available)
	{
		this.available = available;
		if (!this.available)
			this.setEnabled(true);
	}

	setEnabled(enabled)
	{
		this.enabled = enabled;
	}
};
