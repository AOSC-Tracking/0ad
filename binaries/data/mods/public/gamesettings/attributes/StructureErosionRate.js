GameSettings.prototype.Attributes.StructureErosionRate = class StructureErosionRate extends GameSetting
{
    init()
    {
        this.value = 0.8;  // Default to "Low erosion"
        this.settings.map.watch(() => this.onMapChange(), ["map"]);
    }

    toInitAttributes(attribs)
    {
        attribs.settings.StructureErosionRate = this.value;
    }

    fromInitAttributes(attribs)
    {
        if (!this.getLegacySetting(attribs, "StructureErosionRate"))
            this.value = 0.8;  // Default to "Low erosion"
        else
            this.value = +this.getLegacySetting(attribs, "StructureErosionRate");
    }

    onMapChange()
    {
        if (!this.getMapSetting("StructureErosionRate"))
            this.value = 0.8;  // Default to "Low erosion"
        else
            this.value = +this.getMapSetting("StructureErosionRate");
    }

    setValue(val)
    {
        this.value = +val;
    }
};
