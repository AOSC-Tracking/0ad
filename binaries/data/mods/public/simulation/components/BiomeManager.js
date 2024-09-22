/**
  * A manager class for biomes.
  * @class
  * @constructor
  */
function BiomeManager() {}

/**
 * Defines the XML schema and help strings of the manager.
 * @memberof BiomeManager
 */
BiomeManager.prototype.Schema =
	"<a:component type='system'/><empty/>";

/**
 * Initializes the current map's biome.
 * @memberof BiomeManager
 */
BiomeManager.prototype.Init = function()
{
    this.biome = "";
}

/**
 * Sets the current map's biome.
 * @param {string} biome - The new biome.
 * @memberof BiomeManager
 */
BiomeManager.prototype.SetBiome = function(biome)
{
    this.biome = biome;
}

/**
 * Returns the current map's biome.
 * @memberof BiomeManager
 */
BiomeManager.prototype.GetBiome = function()
{
	return this.biome;
}

Engine.RegisterSystemComponentType(IID_BiomeManager, "BiomeManager", BiomeManager);
