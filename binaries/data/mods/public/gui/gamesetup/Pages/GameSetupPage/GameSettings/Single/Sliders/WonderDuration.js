GameSettingControls.WonderDuration = class WonderDuration extends GameSettingControlSlider
{
	constructor(...args)
	{
		super(...args);

		g_GameSettings.wonder.watch(() => this.render(), ["duration", "available"]);
		g_GameSettings.map.watch(() => this.render(), ["type"]);
		this.render();
	}

	render()
	{
		this.setHidden(!g_GameSettings.wonder.available);
		this.setEnabled(g_GameSettings.map.type != "scenario");

		if (g_GameSettings.wonder.available)
		{
			const value = g_GameSettings.wonder.duration;
			this.setSelectedValue(
				g_GameSettings.wonder.duration,
				value == 0 ? this.InstantVictory :
					sprintf(this.CaptionVictoryTime(value), { "min": value }));
		}
	}
};

GameSettingControls.WonderDuration.prototype.AttributeName = "wonder";

GameSettingControls.WonderDuration.prototype.TitleCaption =
	translate("Wonder Duration");

GameSettingControls.WonderDuration.prototype.Tooltip =
	translate("Minutes until the player has achieved Wonder Victory");

GameSettingControls.WonderDuration.prototype.CaptionVictoryTime =
	min => translatePluralWithContext("victory duration", "%(min)s minute", "%(min)s minutes", min);

GameSettingControls.WonderDuration.prototype.InstantVictory =
	translateWithContext("victory duration", "Immediate Victory.");

GameSettingControls.WonderDuration.prototype.MinValue = 0;

GameSettingControls.WonderDuration.prototype.MaxValue = 60;

GameSettingControls.WonderDuration.prototype.DefaultValue = 20;
