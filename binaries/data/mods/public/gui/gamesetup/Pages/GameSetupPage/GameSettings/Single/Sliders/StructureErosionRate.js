GameSettingControls.StructureErosionRate = class StructureErosionRate extends GameSettingControlSlider
{
    constructor(...args)
    {
        super(...args);

        g_GameSettings.structureErosionRate.watch(() => this.render(), ["value"]);
        g_GameSettings.map.watch(() => this.render(), ["type"]);
        this.render();
    }

    render()
    {
        this.setEnabled(g_GameSettings.map.type != "scenario");

        const value = g_GameSettings.structureErosionRate.value;
        const label = this.getErosionLabel(value);

        this.setSelectedValue(value, label);
    }

    onValueChange(value)
    {
        g_GameSettings.structureErosionRate.setValue(value);
        this.gameSettingsController.setNetworkInitAttributes();
    }

    getErosionLabel(erosionRate)
    {
        erosionRate = Math.round(erosionRate * 10) / 10;
        if (erosionRate > 4.5)
            return sprintf(translate("Sandstorm (%(value)s)"), { "value": erosionRate.toFixed(1) });
        if (erosionRate > 3)
            return sprintf(translate("Rapid erosion (%(value)s)"), { "value": erosionRate.toFixed(1) });
        if (erosionRate > 1.5)
            return sprintf(translate("Moderate erosion (%(value)s)"), { "value": erosionRate.toFixed(1) });
        if (erosionRate > 0)
            return sprintf(translate("Slow erosion (%(value)s)"), { "value": erosionRate.toFixed(1) });
        return translate("No erosion");
    }
};

GameSettingControls.StructureErosionRate.prototype.TitleCaption =
    translate("Structure Erosion");

GameSettingControls.StructureErosionRate.prototype.Tooltip =
    translate("Set the rate at which damaged and neglected structures erode naturally.");

GameSettingControls.StructureErosionRate.prototype.DefaultValue = 0.8;  // Default is "Low erosion"

GameSettingControls.StructureErosionRate.prototype.MinValue = 0;

GameSettingControls.StructureErosionRate.prototype.MaxValue = 5;
