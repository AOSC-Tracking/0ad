GameSettingControls.RelicDuration = GameSettingControlSlider.bind(undefined, {
	"triggers": { "relicDuration": ["value", "available"], "map": ["type"] },
	"render": function()
		{
			this.setHidden(!g_GameSettings.relicDuration.available);
			this.setEnabled(g_GameSettings.map.type != "scenario");

			if (g_GameSettings.relicDuration.available)
			{
				const value = g_GameSettings.relicDuration.value;
				this.setSelectedValue(value, value == 0 ?
					translateWithContext("victory duration", "Immediate Victory.") :
					sprintf(translatePluralWithContext("victory duration", "%(min)s minute",
						"%(min)s minutes", value), { "min": value }));
			}
		},
	"attributeName": "relicDuration",
	"titleCaption": translate("Relic Duration"),
	"tooltip": translate("Minutes until the player has achieved Relic Victory."),
	"minValue": 0,
	"maxValue": 60
});
