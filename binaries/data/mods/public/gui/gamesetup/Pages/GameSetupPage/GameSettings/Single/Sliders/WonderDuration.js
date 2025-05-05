GameSettingControls.WonderDuration = GameSettingControlSlider.bind(undefined, {
	"triggers": { "wonder": ["duration", "available"], "map": ["type"] },
	"render": function()
		{
			this.setHidden(!g_GameSettings.wonder.available);
			this.setEnabled(g_GameSettings.map.type != "scenario");

			if (g_GameSettings.wonder.available)
			{
				const value = g_GameSettings.wonder.duration;
				this.setSelectedValue(
					g_GameSettings.wonder.duration,
					value == 0 ? translateWithContext("victory duration", "Immediate Victory.") :
						sprintf(translatePluralWithContext("victory duration", "%(min)s minute",
							"%(min)s minutes", value), { "min": value }));
			}
		},
	"attributeName": "wonder",
	"titleCaption": translate("Wonder Duration"),
	"tooltip": translate("Minutes until the player has achieved Wonder Victory."),
	"minValue": 0,
	"maxValue": 60
});
