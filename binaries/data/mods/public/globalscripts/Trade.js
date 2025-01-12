/**
 * Normalize the trade gain as a function of mapSize for a default of: size=1024 and distance= 100m
 * @param {number} mapSize - The size of the map.
 */
function TradeGainNormalization(mapSize)
{
	return Math.sqrt(1024 / mapSize) / TradeGain(10000, mapSize);
}

/**
 * Part of the trade gain which depends on the distance, the full gain being TradeGainNormalization * TradeGain.
 * @param {number} distanceSquared - The square of the distance between the two traders.
 * @param {number} mapSize - The size of the map.
 */
function TradeGain(distanceSquared, mapSize)
{
	return distanceSquared / (1 + 0.25 * Math.sqrt(distanceSquared) / mapSize);
}
