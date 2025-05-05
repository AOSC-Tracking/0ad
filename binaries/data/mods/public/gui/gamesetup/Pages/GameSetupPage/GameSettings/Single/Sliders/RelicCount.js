GameSettingControls.RelicCount = GameSettingControlSlider.bind(undefined, {
	"triggers": { "relicCount": ["value", "available"], "map": ["type"] },
	"render": function()
		{
			this.setHidden(!g_GameSettings.relicCount.available);
			this.setEnabled(g_GameSettings.map.type != "scenario");

			if (g_GameSettings.relicCount.available)
			{
				const value = g_GameSettings.relicCount.value;
				this.setSelectedValue(value, value == 0 ? this.InstantVictory :
					sprintf(translatePlural("%(number)s relic", "%(number)s relics", value),
						{ "number": value }));
			}
		},
	"attributeName": "relicCount",
	"titleCaption": translate("Relic Count"),
	"tooltip": translate("Total number of relics spawned on the map. Relic victory is most realistic with only one or two relics. With greater numbers, the relics are important to capture to receive aura bonuses."),
	"minValue": 1,
	"maxValue": Object.keys(g_CivData).length
});
