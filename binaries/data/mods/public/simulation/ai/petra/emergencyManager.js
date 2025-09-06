import { emergency as chatEmergency } from "simulation/ai/petra/chatHelper.js";

/**
 * Checks for emergencies and acts accordingly
 */
const EMERGENCY_NONE = 0;
const EMERGENCY_LOW = 1;
const EMERGENCY_HEAVY = 2;
const EMERGENCY_FINAL = 3;

export function EmergencyManager(Config)
{
	this.Config = Config;
	this.referencePopulation = 0;
	this.referenceStructureCount = 0;
	this.numRoots = 0;
	this.hasEmergency = false;
	this.emergencyState = EMERGENCY_NONE;
};

EmergencyManager.prototype.init = function(gameState)
{
	this.referencePopulation = gameState.getPopulation();
	this.referenceStructureCount = gameState.getOwnStructures().length;
	this.numRoots = this.rootCount(gameState);
};

EmergencyManager.prototype.update = function(gameState)
{
	if (this.hasEmergency)
	{
		this.emergencyUpdate(gameState);
		return;
	}
	const pop = gameState.getPopulation();
	const nStructures = gameState.getOwnStructures().length;
	const nRoots = this.rootCount(gameState);
	const factors = this.Config.emergencyValues;
	const hasEmergencyPopulation = ((pop / this.referencePopulation) < factors.population || pop === 0);
	const hasEmergencyStructureCount = ((nStructures / this.referenceStructureCount) < factors.structures || nStructures === 0);
	const hasEmergencyRootCount = (nRoots / this.numRoots) <= factors.roots || (nRoots === 0 && this.numRoots !== 0);
	if ((hasEmergencyPopulation && hasEmergencyStructureCount) || hasEmergencyRootCount)
		this.startEmergency(gameState);

	if (pop > this.referencePopulation || this.hasEmergency)
		this.referencePopulation = pop;
	if (nStructures > this.referenceStructureCount || this.hasEmergency)
		this.referenceStructureCount = nStructures;
	if (nRoots > this.numRoots || this.hasEmergency)
		this.numRoots = nRoots;
};

EmergencyManager.prototype.emergencyUpdate = function(gameState)
{
	const pop = gameState.getPopulation();
	const nStructures = gameState.getOwnStructures().length;
	const nRoots = this.rootCount(gameState);

	if ((pop > this.referencePopulation * 1.2 &&
		nStructures > this.referenceStructureCount * 1.2) ||
		nRoots > this.numRoots)
	{
		this.setEmergency(gameState, false);
		this.referencePopulation = pop;
		this.referenceStructureCount = nStructures;
		this.numRoots = nRoots;
		return;
	}
	if (nRoots > 1) {
		this.emergencyState = EMERGENCY_LOW;
		return;
	}
	if (nRoots === 0) {
		this.emergencyState = EMERGENCY_FINAL;
		return;
	}

	if (nRoots === 1) {
		const onlyRoot = gameState.getOwnStructures().filter(ent => {
			return ent?.get("TerritoryInfluence")?.Root === "true"
		}).toEntityArray()[0];
		// TODO: Also check if it's nearly captured
		const healthLevel = onlyRoot.healthLevel();
		if (healthLevel < 0.2) {
			this.emergencyState = EMERGENCY_FINAL;
		} else if (healthLevel < 0.4) {
			this.emergencyState = EMERGENCY_HEAVY;
		} else {
			this.emergencyState = EMERGENCY_LOW;
		}
	}
};

EmergencyManager.prototype.rootCount = function(gameState)
{
	let roots = 0;
	gameState.getOwnStructures().toEntityArray().forEach(ent => {
		if (ent?.get("TerritoryInfluence")?.Root === "true")
			roots++;
	});
	return roots;
};

EmergencyManager.prototype.startEmergency = function(gameState)
{
	this.emergencyState = EMERGENCY_LOW;
	this.setEmergency(gameState, true);
};

EmergencyManager.prototype.setEmergency = function(gameState, enable)
{
	this.hasEmergency = enable;
	chatEmergency(gameState, enable);
};

EmergencyManager.prototype.Serialize = function()
{
	return {
		"referencePopulation": this.referencePopulation,
		"referenceStructureCount": this.referenceStructureCount,
		"numRoots": this.numRoots,
		"hasEmergency": this.hasEmergency,
		"emergencyState": this.emergencyState,
	};
};

EmergencyManager.prototype.Deserialize = function(data)
{
	for (const key in data)
		this[key] = data[key];
};
