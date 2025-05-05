GameSettingControls.SeaLevelRiseTime = class SeaLevelRiseTime extends GameSettingControlSlider
{
	constructor(...args)
	{
		super(...args);

		g_GameSettings.seaLevelRise.watch(() => this.render(), ["value"]);
		g_GameSettings.map.watch(() => this.render(), ["type"]);
		this.render();
	}

	render()
	{
		let hidden = g_GameSettings.seaLevelRise.value === undefined;
		this.setHidden(hidden);
		this.setEnabled(g_GameSettings.map.type != "scenario");
		if (hidden)
			return;

		const value = g_GameSettings.seaLevelRise.value;
		this.setSelectedValue(
			value, sprintf(this.SeaLevelRiseTimeCaption(value), { "minutes": value }));
	}
};

GameSettingControls.SeaLevelRiseTime.prototype.AttributeName = "seaLevelRise";

GameSettingControls.SeaLevelRiseTime.prototype.TitleCaption =
	translate("Sea Level Rise Time");

GameSettingControls.SeaLevelRiseTime.prototype.Tooltip =
	translate("Set the time when the water will start to rise.");

GameSettingControls.SeaLevelRiseTime.prototype.SeaLevelRiseTimeCaption =
	minutes => translatePluralWithContext("sea level rise time", "%(minutes)s minute", "%(minutes)s minutes", minutes);

GameSettingControls.SeaLevelRiseTime.prototype.MinValue = 0;

GameSettingControls.SeaLevelRiseTime.prototype.MaxValue = 60;
