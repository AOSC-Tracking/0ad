function TerritoryDecayManager() {}

TerritoryDecayManager.prototype.Schema =
        "<a:component type='system'/><empty/>";

TerritoryDecayManager.prototype.Init = function()
{
	this.list = new Set();
};

/**
 * @param {number} ent
 */
TerritoryDecayManager.prototype.Add = function(ent)
{
	this.list.add(ent);
};

/**
 * @param {number} ent
 */
TerritoryDecayManager.prototype.Remove = function(ent)
{
	this.list.delete(ent);
};

TerritoryDecayManager.prototype.SetBlinkingEntities = function()
{
	for (let ent of this.list.values())
		Engine.QueryInterface(ent, IID_TerritoryDecay).IsConnected();
};

Engine.RegisterSystemComponentType(IID_TerritoryDecayManager, "TerritoryDecayManager", TerritoryDecayManager);
