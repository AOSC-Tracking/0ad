/**
 * @typedef {{
 *   radius: number,
 *   texture: string,
 *   textureMask: string,
 *   thickness: number,
 * }} RangeOverlayData
 */
function RangeOverlayManager() {
	/** @type {EntityId} */
	this.entity;

	/** @type {Map<"Attack" | "Auras" | "Heal", RangeOverlayData[]>} */
	this.rangeVisualizations;

	/** @type {{Attack: boolean, Auras: boolean, Heal: boolean}} */
	this.enabledRangeTypes;

	/** @type {boolean} */
	this.enabled;
}

RangeOverlayManager.prototype.Schema = "<empty/>";

RangeOverlayManager.prototype.Init = function()
{
	this.enabled = false;
	this.enabledRangeTypes = {
		"Attack": false,
		"Auras": false,
		"Heal": false
	};

	this.rangeVisualizations = new Map();
};

/** @type {any} The GUI enables visualizations */
RangeOverlayManager.prototype.Serialize = null;

/** @param {unknown} data */
RangeOverlayManager.prototype.Deserialize = function(data)
{
	this.Init();
};

/** @param {"Attack" | "Auras" | "Heal"} componentName */
RangeOverlayManager.prototype.UpdateRangeOverlays = function(componentName)
{
	/** @ts-expect-error; @type {Attack | Auras | Heal} */
	let cmp = Engine.QueryInterface(this.entity, global["IID_" + componentName]);
	if (cmp)
		this.rangeVisualizations.set(componentName, cmp.GetRangeOverlays());
};

/**
 * @param {boolean} enabled
 * @param {{Attack: boolean, Auras: boolean, Heal: boolean}} enabledRangeTypes
 * @param {boolean} forceUpdate
 */
RangeOverlayManager.prototype.SetEnabled = function(enabled, enabledRangeTypes, forceUpdate)
{
	this.enabled = enabled;
	this.enabledRangeTypes = enabledRangeTypes;

	this.RegenerateRangeOverlays(forceUpdate);
};

/** @param {boolean} forceUpdate */
RangeOverlayManager.prototype.RegenerateRangeOverlays = function(forceUpdate)
{
	let cmpRangeOverlayRenderer = Engine.QueryInterface(this.entity, IID_RangeOverlayRenderer);
	if (!cmpRangeOverlayRenderer)
		return;

	cmpRangeOverlayRenderer.ResetRangeOverlays();

	if (!this.enabled && !forceUpdate)
		return;

	// Only render individual range types that have been enabled
	for (let rangeOverlayType of this.rangeVisualizations.keys())
		if (this.enabledRangeTypes[rangeOverlayType])
			for (let rangeOverlay of /** @type {RangeOverlayData[]} */(this.rangeVisualizations.get(rangeOverlayType)))
				cmpRangeOverlayRenderer.AddRangeOverlay(
					rangeOverlay.radius,
					rangeOverlay.texture,
					rangeOverlay.textureMask,
					rangeOverlay.thickness);
};

/** @param {MessageOwnershipChanged} msg */
RangeOverlayManager.prototype.OnOwnershipChanged = function(msg)
{
	if (msg.to == INVALID_PLAYER)
		return;
	for (let type in this.enabledRangeTypes)
		// @ts-expect-error
		this.UpdateRangeOverlays(type);

	this.RegenerateRangeOverlays(false);
};

/** @param {MessageValueModification} msg */
RangeOverlayManager.prototype.OnValueModification = function(msg)
{
	if (msg.valueNames.indexOf("Heal/Range") == -1 &&
	    msg.valueNames.indexOf("Attack/Ranged/MinRange") == -1 &&
	    msg.valueNames.indexOf("Attack/Ranged/MaxRange") == -1)
		return;

	// @ts-expect-error - we know that the component is either "Heal" or "Attack"
	this.UpdateRangeOverlays(msg.component);
	this.RegenerateRangeOverlays(false);
};

/**
 * RangeOverlayManager component is deserialized before the TechnologyManager, so need to update the ranges here
 */
RangeOverlayManager.prototype.OnDeserialized = function()
{
	for (let type in this.enabledRangeTypes)
		// @ts-expect-error
		this.UpdateRangeOverlays(type);
};

Engine.RegisterComponentType(IID_RangeOverlayManager, "RangeOverlayManager", RangeOverlayManager);
