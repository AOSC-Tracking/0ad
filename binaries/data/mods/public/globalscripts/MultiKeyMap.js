/**
 * Convenient container abstraction for storing items referenced by a 3-tuple.
 * Used by the ModifiersManager to store items by (property Name, entity, item ID).
 * Methods starting with an underscore are private to the storage.
 * This supports stackable items as it stores count for each 3-tuple.
 * It is designed to be as fast as can be for a JS container.
 * @template T
 */
function MultiKeyMap()
{
	/** @type {Map<string, Map<number, { _ID: string, _count: number, value: T }[]>>} */
	this.items = new Map();
	// Keys are referred to as 'primaryKey', 'secondaryKey', 'itemID'.
}

MultiKeyMap.prototype.Serialize = function()
{
	let ret = [];
	for (let primary of this.items.keys())
	{
		// Keys of a Map can be arbitrary types whereas objects only support string, so use a list.
		let vals = [primary, []];
		ret.push(vals);
		for (let secondary of this.items.get(primary).keys())
			vals[1].push([secondary, this.items.get(primary).get(secondary)]);
	}
	return ret;
};

/** @param {any} data */
MultiKeyMap.prototype.Deserialize = function(data)
{
	for (let primary in data)
	{
		this.items.set(data[primary][0], new Map());
		for (let secondary in data[primary][1])
			this.items.get(data[primary][0]).set(data[primary][1][secondary][0], data[primary][1][secondary][1]);
	}
};

/**
 * Add a single item.
 * NB: if you add an item with a different value but the same itemID, the original value remains.
 * @param {string} primaryKey
 * @param {number} secondaryKey
 * @param {T} item - an object.
 * @param {string} itemID - internal ID of this item, for later removal and/or updating
 * @param stackable - if stackable, changing the count of items invalides, otherwise not.
 * @returns true if the items list changed in such a way that cached values are possibly invalidated.
 */
MultiKeyMap.prototype.AddItem = function(primaryKey, itemID, item, secondaryKey, stackable = false)
{
	if (!this._AddItem(primaryKey, itemID, item, secondaryKey, stackable))
		return false;

	this._OnItemModified(primaryKey, secondaryKey, itemID);
	return true;
};

/**
 * Add items to multiple properties at once (only one item per property)
 * @param {string} itemID - internal ID of the item to add
 * @param {number} secondaryKey
 * @param {{ [primaryKey: string]: T }} items - a dictionary of { property: item }
 * @returns true if the items list changed in such a way that cached values are possibly invalidated.
 */
MultiKeyMap.prototype.AddItems = function(itemID, items, secondaryKey, stackable = false)
{
	let modified = false;
	for (let primaryKey in items)
		modified = this.AddItem(primaryKey, itemID, items[primaryKey], secondaryKey, stackable) || modified;
	return modified;
};

/**
 * Removes a item on a property.
 * @param {string} primaryKey - property to change (e.g. "Health/Max")
 * @param {string} itemID - internal ID of the item to remove
 * @param {number} secondaryKey - secondaryKey ID
 * @returns true if the items list changed in such a way that cached values are possibly invalidated.
 */
MultiKeyMap.prototype.RemoveItem = function(primaryKey, itemID, secondaryKey, stackable = false)
{
	if (!this._RemoveItem(primaryKey, itemID, secondaryKey, stackable))
		return false;

	this._OnItemModified(primaryKey, secondaryKey, itemID);
	return true;
};

/**
 * Removes items with this ID for any property name.
 * Naively iterates all property names.
 * @param {string} itemID
 * @param {number} secondaryKey
 * @returns true if the items list changed in such a way that cached values are possibly invalidated.
 */
MultiKeyMap.prototype.RemoveAllItems = function(itemID, secondaryKey, stackable = false)
{
	let modified = false;
	// Map doesn't implement some so use a for-loop here.
	for (let primaryKey of this.items.keys())
		modified = this.RemoveItem(primaryKey, itemID, secondaryKey, stackable) || modified;
	return modified;
};

/**
 * @param {string} primaryKey
 * @param {string} itemID - internal ID of the item to try and find.
 * @param {number} secondaryKey
 * @returns true if there is at least one item with that itemID
 */
MultiKeyMap.prototype.HasItem = function(primaryKey, itemID, secondaryKey)
{
	// some() returns false for an empty list which is wanted here.
	return this._getItems(primaryKey, secondaryKey).some(item => item._ID === itemID);
};

/**
 * Check if we have a item for any property name.
 * Naively iterates all property names.
 * @param {string} itemID - internal ID of the item to try and find.
 * @param {number} secondaryKey
 * @returns true if there is at least one item with that itemID
 */
MultiKeyMap.prototype.HasAnyItem = function(itemID, secondaryKey)
{
	// Map doesn't implement some so use for loops instead.
	for (let primaryKey of this.items.keys())
		if (this.HasItem(primaryKey, itemID, secondaryKey))
			return true;
	return false;
};

/**
 * @param {string} primaryKey
 * @param {number} secondaryKey
 * @returns A list of items (references to stored items to avoid copying)
 * (these need to be treated as constants to not break the map)
 */
MultiKeyMap.prototype.GetItems = function(primaryKey, secondaryKey)
{
	return this._getItems(primaryKey, secondaryKey);
};

/**
 * @param {number} secondaryKey
 * @returns {{ [primaryKey: string]: { _ID: string, _count: number, value: T }[] }} - A dictionary of { Property Name: items } for the secondary Key.
 * Naively iterates all property names.
 */
MultiKeyMap.prototype.GetAllItems = function(secondaryKey)
{
	/** @type {{ [primaryKey: string]: { _ID: string, _count: number, value: any }[] }} */
	let items = {};

	// Map doesn't implement filter so use a for loop.
	for (let primaryKey of this.items.keys())
	{
		if (!this.items.get(primaryKey).has(secondaryKey))
			continue;
		items[primaryKey] = this.GetItems(primaryKey, secondaryKey);
	}
	return items;
};

/**
 * @param {string} primaryKey
 * @param {number} secondaryKey
 * @returns a list of items.
 * This does not necessarily return a reference to items' list, use _getItemsOrInit for that.
 */
MultiKeyMap.prototype._getItems = function(primaryKey, secondaryKey)
{
	let cache = this.items.get(primaryKey);
	if (cache)
		cache = cache.get(secondaryKey);
	return cache ? cache : [];
};

/**
 * @param {string} primaryKey
 * @param {number} secondaryKey
 * @returns {{ _ID: string, _count: number, value: T }[]} - a reference to the list of items for that property name and secondaryKey.
 */
MultiKeyMap.prototype._getItemsOrInit = function(primaryKey, secondaryKey)
{
	let cache = this.items.get(primaryKey);
	if (!cache)
		cache = this.items.set(primaryKey, new Map()).get(primaryKey);

	let cache2 = cache.get(secondaryKey);
	if (!cache2)
		cache2 = cache.set(secondaryKey, []).get(secondaryKey);
	return cache2;
};

/**
 * @param {string} primaryKey
 * @param {string} itemID
 * @param {T} item
 * @param {number} secondaryKey
 * @param {boolean} stackable
 * @returns true if the items list changed in such a way that cached values are possibly invalidated.
 */
MultiKeyMap.prototype._AddItem = function(primaryKey, itemID, item, secondaryKey, stackable)
{
	let items = this._getItemsOrInit(primaryKey, secondaryKey);
	for (let it of items)
		if (it._ID == itemID)
		{
			it._count++;
			return stackable;
		}
	items.push({ "_ID": itemID, "_count": 1, "value": item });
	return true;
};

/**
 * @param {string} primaryKey
 * @param {string} itemID
 * @param {number} secondaryKey
 * @param {boolean} stackable
 * @returns true if the items list changed in such a way that cached values are possibly invalidated.
 */
MultiKeyMap.prototype._RemoveItem = function(primaryKey, itemID, secondaryKey, stackable)
{
	let items = this._getItems(primaryKey, secondaryKey);

	let existingItem = items.filter(item => { return item._ID == itemID; });
	if (!existingItem.length)
		return false;

	if (--existingItem[0]._count > 0)
		return stackable;

	let stilValidItems = items.filter(item => item._count > 0);

	// Delete entries from the map if necessary to clean up.
	if (!stilValidItems.length)
	{
		this.items.get(primaryKey).delete(secondaryKey);
		if (!this.items.get(primaryKey).size)
			this.items.delete(primaryKey);
		return true;
	}
	// @ts-expect-error never null
	this.items.get(primaryKey).set(secondaryKey, stilValidItems);

	return true;
};

/**
 * Stub method, to overload.
 * @param {string} primaryKey
 * @param {number} secondaryKey
 * @param {string} itemID
 */
MultiKeyMap.prototype._OnItemModified = function(primaryKey, secondaryKey, itemID) {};
