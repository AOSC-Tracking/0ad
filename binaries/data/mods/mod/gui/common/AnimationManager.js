/**
 * This class manages all GUI animations.
 */
class AnimationManager
{
	constructor()
	{
		// Used to instantly "revert" animations.
		this.objectStatesBeforeAnimation = {};

		// The keys are the object names and their values an instances of the ObjectAnimation class running on them.
		// When the instance is idle the entry is to be deleted.
		this.animatedObjects = new Map();
	}

    /**
     * Add a property animation to the given object. Most of the parameters are just passed on to the ObjectAnimation class.
     * @param {Object} guiObject
     * @param {string} propertyName
     * @param {Object} propertyValue
     * @param {Object} [animationConfig]
     * @param {Object} [handlers]
     */
	addPropertyAnimation(guiObject, propertyName, propertyValue, animationConfig, handlers)
	{
		// TODO: Maybe check somehow whether the object actually has that property. (requires some arrangements in the engine)
		if (this.animatableProperties[propertyName] == undefined)
		{
			warn("GuiAnimator: Ignoring invalid GUI object property specified to animate: '" + propertyName + "'.");
			return;
		}

		if (!this.animatedObjects.has(guiObject.name))
		{
			this.animatedObjects.set(guiObject.name, new ObjectAnimation(this, guiObject));
			this.objectStatesBeforeAnimation[guiObject.name] = {};
		}

		if (this.objectStatesBeforeAnimation[guiObject.name][propertyName] === undefined)
            this.objectStatesBeforeAnimation[guiObject.name][propertyName] = Object.assign({}, (this.animatableProperties[propertyName].get(guiObject)));

		const objectAnimation = this.animatedObjects.get(guiObject.name);

		// Handle potential conflicts - by just deleting them ... what a great life lesson :D
		if (objectAnimation.hasProperty(propertyName))
			objectAnimation.discardProperty(propertyName);

		objectAnimation.attachProperty(propertyName, propertyValue, animationConfig, handlers);
	}

    /**
     * Remove the animation of a given property from a given GUI object and delete its entry if it was the only one.
     * @param {Object} guiObject
     * @param {string} propertyName
     */
	removePropertyAnimation(guiObject, propertyName)
	{
		const objectAnimation = this.animatedObjects.get(guiObject.name);
		if (objectAnimation == undefined)
		{
			warn("GuiAnimator: Attempted to halt animations on an object that has none: '" + guiObject.name + "'.");
			return;
		}

		if (objectAnimation.hasProperty(propertyName))
			objectAnimation.discardProperty(propertyName);
		else
			warn("GuiAnimator: Failed to halt animation of property '" + property + "' on object: '" + guiObject.name + "'.");

		if (objectAnimation.isEmpty())
			this.animatedObjects.delete(guiObject.name);
	}

    /**
     * Clear all animations from the given GUI object.
     * @param {Object} guiObject
     * @param {boolean} shouldComplete - Whether skip to the animation's end or abpruptly cancel it.
     */
	removeObjectAnimation(guiObject, shouldComplete)
	{
		const objectAnimation = this.animatedObjects.get(guiObject.name);
		if (objectAnimation == undefined)
		{
			warn("GuiAnimator: Attempted to halt animations on an object that has none: '" + guiObject.name + "'.");
			return;
		}

		const properties = objectAnimation.getProperties();

		if (shouldComplete)
			for (const property of properties)
				objectAnimation.completeProperty(property);
		else
			for (const property of properties)
				objectAnimation.discardProperty(property);

		this.animatedObjects.delete(guiObject.name);
	}

    /**
     * Reset previously animated properties of a given object to their state before the last animation.
     * @param {Object} guiObject
     * @returns
     */
	applyLastUnanimatedObjectState(guiObject)
	{
		if (this.objectStatesBeforeAnimation[guiObject.name] === undefined)
		{
			warn("GuiAnimator: Failed to revert animations on object '" + guiObject.name + "': It had never been animated in the first place.");
			return;
		}

		for (const property of Object.keys(this.objectStatesBeforeAnimation[guiObject.name]))
			this.animatableProperties[property].set(guiObject, this.objectStatesBeforeAnimation[guiObject.name][property]);

		if (this.animatedObjects.has(guiObject.name))
			this.removeObjectAnimation(guiObject.name, false);
	};

	/**
	 * Clear this.animatedObjects entirely (but keep the cached object states).
	 */
	stopAllAnimations()
	{
		for (const objectName of this.animatedObjects.keys())
			this.removeObjectAnimation(objectName, false);

	}

	defaultConfiguration = {
		"duration": 150,
		"curve": "linear",
		"delay": 0
	};

	animationEvents = ["onStart", "onTick", "onComplete"];

	animationCurves = {
		"linear": x => x,
		"ease-in": x => x * x,
		"ease-out": x => 1 - (1 - x) * (1 - x),
		"ease-in-out-strong": x => x * x * x * (x * (x * 6 - 15) + 10),
		"ease-in-out-subtle": x => 3 * x * x * (1 - x) + x * x * x,
	};
};

/**
 * Filled in animatableProperties.js.
 */
AnimationManager.prototype.animatableProperties = {};