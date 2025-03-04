/**
 * This class is instantiated on every GUI object that is to be animated.
 * However, it only manages all animations running on it and does NOT modify the object's properties in any way.
 * It instead instantiates the PropertyAnimation class to do so.
 */
class ObjectAnimation
{
	/**
	 * @param {Object} manager - The instance of the AnimationManager class.
	 * @param {Object} guiObject
	 */
	constructor(manager, guiObject)
	{
		this.guiObject = guiObject;
		this.manager = manager;
		this.animatedProperties = {};
	}

	/**
	 * Start the given animation on this object.
	 * @param {string} propertyName
	 * @param {Object} propertyValues
	 * @param {Object} [configuration]
	 * @param {Object} [handlers]
	 */
	attachProperty(propertyName, propertyValues, configuration = {}, handlers = {})
	{
		this.guiObject.onTick = this.onTick.bind(this);

		this.cleanAndCompleteParams(propertyName, propertyValues, configuration, handlers);

		this.animatedProperties[propertyName] = new PropertyAnimation(this.manager, this.guiObject, propertyName, propertyValues, configuration, handlers);
	}

	/**
	 * Fill up the animation parameters with defaults and throw warnings for invalid data.
	 * @param {string} propertyName
	 * @param {Object} propertyValues
	 * @param {Object} configuration
	 * @param {Object} handlers
	 */
	cleanAndCompleteParams(propertyName, propertyValues, configuration, handlers)
	{
		// propertyName has already been validated at this point.
		let invalidPropertyKeys = new Set(Object.keys(propertyValues));
		for (const key of this.manager.animatableProperties[propertyName].values)
			if (propertyValues[key] === undefined)
				propertyValues[key] = this.manager.animatableProperties[propertyName].get(this.guiObject)[key];
			else
				invalidPropertyKeys.delete(key);
		for (const key of invalidPropertyKeys)
			warn("GuiAnimator: Ignoring an invalid value type '" + key + "' of property '" + propertyName + "' specified.");

		let invalidConfigKeys = new Set(Object.keys(configuration));
		for (const [key, defaultValue] of Object.entries(this.manager.defaultConfiguration))
			if (configuration[key] === undefined)
				configuration[key] = defaultValue;
			else
				invalidConfigKeys.delete(key);
		for (const key of invalidConfigKeys)
			warn("GuiAnimator: Ignoring an invalid or empty animation configuration value specified: '" + key + "'.");

		let invalidEvents = new Set(Object.keys(handlers));
		for (const event of this.manager.animationEvents)
			if (handlers[event] == undefined)
				handlers[event] = (() => {});
			else
				invalidEvents.delete(event);
		for (const event of invalidEvents)
			warn("GuiAnimator: Ignoring an invalid animation event handler specified: '" + event + "'.");
	}

	onTick()
	{
		const time = Date.now();
		for (const property of Object.values(this.animatedProperties))
			property.onTick(time);
	}

	getProperties()
	{
		return Object.keys(this.animatedProperties);
	}

	hasProperty(property)
	{
		return this.animatedProperties[property] !== undefined;
	}

	/**
	 * Remove the property and thus halt the animation immediately.
	 */
	discardProperty(property)
	{
		delete this.animatedProperties[property];
	}

	completeProperty(property)
	{
		this.animatedProperties[property].complete();
	}

	isEmpty()
	{
		return Object.keys(this.animatedProperties).length === 0;
	}
}
