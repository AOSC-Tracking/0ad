GameSettingControls.RelicDuration = class RelicDuration extends GameSettingControlSlider
{
	constructor(...args)
	{
		super(...args);

		this.available = false;

		g_GameSettings.relicDuration.watch(() => this.render(), ["value", "available"]);
		g_GameSettings.map.watch(() => this.render(), ["type"]);
		this.render();
	}

	render()
	{
		this.setHidden(!g_GameSettings.relicDuration.available);
		this.setEnabled(g_GameSettings.map.type != "scenario");

		if (g_GameSettings.relicDuration.available)
		{
			const value = g_GameSettings.relicDuration.value;
			this.setSelectedValue(value, value == 0 ? this.InstantVictory :
				sprintf(this.CaptionVictoryTime(value), { "min": value }));
		}
	}

	onValueChange(value)
	{
		g_GameSettings.relicDuration.setValue(value);
		this.gameSettingsController.setNetworkInitAttributes();
	}
};

GameSettingControls.RelicDuration.prototype.TitleCaption =
	translate("Relic Duration");

GameSettingControls.RelicDuration.prototype.Tooltip =
	translate("Minutes until the player has achieved Relic Victory.");

GameSettingControls.RelicDuration.prototype.NameCaptureTheRelic =
	"capture_the_relic";

GameSettingControls.RelicDuration.prototype.CaptionVictoryTime =
	min => translatePluralWithContext("victory duration", "%(min)s minute", "%(min)s minutes", min);

GameSettingControls.RelicDuration.prototype.InstantVictory =
	translateWithContext("victory duration", "Immediate Victory.");

GameSettingControls.RelicDuration.prototype.MinValue = 0;

GameSettingControls.RelicDuration.prototype.MaxValue = 60;
