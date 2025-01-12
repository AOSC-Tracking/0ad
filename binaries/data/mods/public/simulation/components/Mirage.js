// @ts-expect-error (redeclared)
const VIS_HIDDEN = 0;
// @ts-expect-error (redeclared)
const VIS_FOGGED = 1;
// @ts-expect-error (redeclared)
const VIS_VISIBLE = 2;

function Mirage() {}

Mirage.prototype.Schema =
	"<a:help>Mirage entities replace real entities in the fog-of-war.</a:help>" +
	"<empty/>";

Mirage.prototype.Init = function()
{
};

/**
 * @param {EntityId} ent
 */
Mirage.prototype.SetParent = function(ent)
{
	this.parent = ent;
};

Mirage.prototype.GetParent = function()
{
	return this.parent;
};

/**
 * @param {number} player
 */
Mirage.prototype.SetPlayer = function(player)
{
	this.player = player;
};

Mirage.prototype.GetPlayer = function()
{
	return this.player;
};

/**
 * @param {IID} iid
 */
Mirage.prototype.Mirages = function(iid)
{
	return this.miragedIids.has(iid);
};

/**
 * @template {Fogging["componentsToMirage"][number]} T
 * @param {T} iid
 */
Mirage.prototype.Get = function(iid)
{
	return /** @type {ReturnType<IIDs[T]["Mirage"]>} */(this.miragedIids.get(iid));
};

// ============================
// Parent entity data

/**
 * @param {Fogging["componentsToMirage"][number]} iid - The component to mirage.
 */
Mirage.prototype.CopyComponent = function(iid)
{
	let cmp = Engine.QueryInterface(this.parent, iid);
	if (cmp)
		this.miragedIids.set(iid, cmp.Mirage(this.entity, this.player));
};

// ============================

/** @param {MessageVisibilityChanged} msg */
Mirage.prototype.OnVisibilityChanged = function(msg)
{
	// Mirages get VIS_HIDDEN when the original entity becomes VIS_VISIBLE.
	if (msg.player != this.player || msg.newVisibility != VIS_HIDDEN)
		return;

	if (this.miragedIids.has(IID_Market))
		/** @type {MarketMirage} */(this.miragedIids.get(IID_Market)).UpdateTraders();

	if (this.parent == INVALID_ENTITY)
		Engine.DestroyEntity(this.entity);
	else
		Engine.PostMessage(this.entity, MT_EntityRenamed, { "entity": this.entity, "newentity": this.parent });
};

Engine.RegisterComponentType(IID_Mirage, "Mirage", Mirage);
