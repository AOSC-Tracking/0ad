function Looter() {
  /** @type {EntityId} */
  this.entity;
}

Looter.prototype.Schema = "<empty/>";

// @ts-expect-error
Looter.prototype.Serialize = null; // We have no dynamic state to save

/**
 * Try to collect loot from target entity
 * @param {EntityId} targetEntity
 */
Looter.prototype.Collect = function (targetEntity) {
  var cmpLoot = Engine.QueryInterface(targetEntity, IID_Loot);
  if (!cmpLoot) return;

  // Collect resources carried by workers and traders
  var cmpResourceGatherer = Engine.QueryInterface(
    targetEntity,
    IID_ResourceGatherer
  );
  var cmpTrader = Engine.QueryInterface(targetEntity, IID_Trader);

  let resourcesCarried = calculateCarriedResources(
    cmpResourceGatherer && cmpResourceGatherer.GetCarryingStatus(),
    cmpTrader && cmpTrader.GetGoods()
  );

  // Loot resources as defined in the templates
  let lootTemplate = cmpLoot.GetResources();
  /** @type {Record<string, number>} */
  let resources = {};
  for (let type of g_Resources.GetCodes())
    resources[type] =
      ApplyValueModificationsToEntity(
        "Looter/Resource/" + type,
        lootTemplate[type] || 0,
        this.entity
      ) + (resourcesCarried[type] || 0);

  // Transfer resources
  var cmpPlayer = QueryOwnerInterface(this.entity, IID_Player);
  if (cmpPlayer) cmpPlayer.AddResources(resources);

  // Update statistics
  var cmpStatisticsTracker = QueryOwnerInterface(
    this.entity,
    IID_StatisticsTracker
  );
  if (cmpStatisticsTracker)
    cmpStatisticsTracker.IncreaseLootCollectedCounter(resources);
};

Engine.RegisterComponentType(IID_Looter, "Looter", Looter);
