/**
  * A manager class for biomes.
  * @class
  * @constructor
  */
function BiomeReplacer() {}

/**
 * Defines the XML schema and help strings of the component.
 * @memberof BiomeReplacer
 */
BiomeReplacer.prototype.Schema = `
	<a:help>Defines the variants an entity can assume depending on a map biome.</a:help>
	<a:example>
		<Variants>
			<Winter>
				<AffectedBiomes datatype="tokens">generic/alpine</AffectedBiomes>
				<ActorVariant>winter</ActorVariant>
			</Winter>
		</Variants>
	</a:example>
	<element name='Variants' a:help='Effect for having multiple builders.'>
		<oneOrMore>
			<element a:help='Element containing the variant data.'>
				<anyName/>
				<interleave>
					<element name='AffectedBiomes' a:help='Names of the biomes affected byt this variant'>
						<attribute name='datatype'>
							<value>tokens</value>
						</attribute>
						<text/>
					</element>
					<element name='ActorVariant' a:help='Actor variant to switch to.'>
						<text/>
					</element>
				</interleave>
			</element>
		</oneOrMore>
	</element>`;

/**
 * Initializes the biome replacer.
 * @memberof BiomeReplacer
 */
BiomeReplacer.prototype.Init = function()
{

}

BiomeReplacer.prototype.OnGlobalEntityRenamed = function(msg)
{
	this.OnCreate(msg);
}


BiomeReplacer.prototype.OnOwnershipChanged = function(msg)
{
	this.OnCreate(msg);
}

/**
 * @param {{ "from": number, "to": number }} msg - Message containing the old new owner.
 * @memberof BiomeReplacer
 */
BiomeReplacer.prototype.OnCreate = function(msg)
{

		const currentBiome = Engine.QueryInterface(SYSTEM_ENTITY, IID_BiomeManager)?.GetBiome();
		if (!currentBiome)
			return;

		let cmpVisual = Engine.QueryInterface(this.entity, IID_Visual);

		if (!cmpVisual)
			return;

		for (const variantName of Object.keys(this.template.Variants))
		{
			const variant = this.template.Variants[variantName];
			if (!variant.AffectedBiomes || !variant.AffectedBiomes._string)
				continue;

			const affectedBiomes = variant.AffectedBiomes._string.split(" ");
			if (affectedBiomes.indexOf(currentBiome) !== -1)
			{
				cmpVisual.SetVariant("biomeVariant", variant.ActorVariant);
				return;
			}
		}
};

Engine.RegisterComponentType(IID_BiomeReplacer, "BiomeReplacer", BiomeReplacer);
