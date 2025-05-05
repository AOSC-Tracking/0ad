GameSettingControls.Ceasefire = class Ceasefire extends GameSettingControlSlider
{
	constructor(...args)
	{
		super({ "ceasefire": ["value"], "map": ["type"] }, ...args);
	}

	render()
	{
		this.setEnabled(g_GameSettings.map.type != "scenario");

		const value = Math.round(g_GameSettings.ceasefire.value);
		this.setSelectedValue(g_GameSettings.ceasefire.value,
			value == 0 ?
				this.NoCeasefireCaption :
				sprintf(this.CeasefireCaption(value), { "minutes": value }));
	}
};

GameSettingControls.Ceasefire.prototype.AttributeName = "ceasefire";

GameSettingControls.Ceasefire.prototype.TitleCaption =
	translate("Ceasefire");

GameSettingControls.Ceasefire.prototype.Tooltip =
	translate("Set time where no attacks are possible.");

GameSettingControls.Ceasefire.prototype.NoCeasefireCaption =
	translateWithContext("ceasefire", "No ceasefire");

GameSettingControls.Ceasefire.prototype.CeasefireCaption =
	minutes => translatePluralWithContext("ceasefire", "%(minutes)s minute", "%(minutes)s minutes", minutes);

GameSettingControls.Ceasefire.prototype.DefaultValue = 0;

GameSettingControls.Ceasefire.prototype.MinValue = 0;

GameSettingControls.Ceasefire.prototype.MaxValue = 45;
