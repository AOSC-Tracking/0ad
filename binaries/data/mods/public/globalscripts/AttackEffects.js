/**
 * @typedef {{
 *   code: string,
 *   name: string,
 *   description: string,
 *   IID: string,
 *   method: string,
 *   order: number
 * }} AttackEffectMetadata
 */
/**
 * @typedef {{ type: string, IID: IID, method: string }} AttackEffectDefinition
 */

/**
 * This class provides a cache for accessing attack effects stored in JSON files.
 */
class AttackEffects
{
	constructor()
	{
		/** @type {Record<string, AttackEffectMetadata>} */
		let effectsDataObj = {};

		/** @type {AttackEffectDefinition[]} */
		this.effectReceivers = [];

		for (let filename of Engine.ListDirectoryFiles("simulation/data/attack_effects", "*.json", false))
		{
			let data = Engine.ReadJSONFile(filename);
			if (!data)
				continue;

			if (effectsDataObj[data.code])
			{
				error("Encountered two effect types with the code " + data.name + ".");
				continue;
			}

			effectsDataObj[data.code] = data;

			this.effectReceivers.push({
				"type": data.code,
				"IID": data.IID,
				"method": data.method
			});
		}

		/**
		 * @param {AttackEffectMetadata} a
		 * @param {AttackEffectMetadata} b
		 */
		let effDataSort = (a, b) => a.order < b.order ? -1 : a.order > b.order ? 1 : 0;
		/**
		 * @param {AttackEffectDefinition} a
		 * @param {AttackEffectDefinition} b
		 */
		let effSort = (a, b) => effDataSort(
			effectsDataObj[a.type],
			effectsDataObj[b.type]
		);
		this.effectReceivers.sort(effSort);

		deepfreeze(this.effectReceivers);
	}

	/**
	 * @return {AttackEffectDefinition[]} - The effects possible with their data.
	 */
	Receivers()
	{
		return this.effectReceivers;
	}
}
