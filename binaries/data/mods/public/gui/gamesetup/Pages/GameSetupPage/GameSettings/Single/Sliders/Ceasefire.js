GameSettingControls.Ceasefire = GameSettingControlSlider.bind(undefined, {
	"triggers": { "ceasefire": ["value"], "map": ["type"] },
	"render": function()
		{
			this.setEnabled(g_GameSettings.map.type != "scenario");

			const value = Math.round(g_GameSettings.ceasefire.value);
			this.setSelectedValue(g_GameSettings.ceasefire.value, value == 0 ?
				translateWithContext("ceasefire", "No ceasefire") :
				sprintf(translatePluralWithContext("ceasefire", "%(minutes)s minute",
					"%(minutes)s minutes", value), { "minutes": value }));
		},
	"attributeName": "ceasefire",
	"titleCaption": translate("Ceasefire"),
	"tooltip": translate("Set time where no attacks are possible."),
	"minValue": 0,
	"maxValue": 45
});
