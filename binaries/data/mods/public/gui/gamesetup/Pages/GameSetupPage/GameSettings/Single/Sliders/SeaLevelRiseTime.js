GameSettingControls.SeaLevelRiseTime = GameSettingControlSlider.bind(undefined, {
	"triggers": { "seaLevelRise": ["value"], "map": ["type"] },
	"render": function()
		{
			let hidden = g_GameSettings.seaLevelRise.value === undefined;
			this.setHidden(hidden);
			this.setEnabled(g_GameSettings.map.type != "scenario");
			if (hidden)
				return;

			const value = g_GameSettings.seaLevelRise.value;
			this.setSelectedValue(value, sprintf(translatePluralWithContext("sea level rise time",
				"%(minutes)s minute", "%(minutes)s minutes", value), { "minutes": value }));
		},
	"attributeName": "seaLevelRise",
	"titleCaption": translate("Sea Level Rise Time"),
	"tooltip": translate("Set the time when the water will start to rise."),
	"minValue": 0,
	"maxValue": 60
});

