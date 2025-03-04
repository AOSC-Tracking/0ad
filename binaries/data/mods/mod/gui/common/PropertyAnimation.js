/**
 * This class is instantiated for every single property animated on any object.
 * Solely it is responsible for actually executing the animation.
 */
class PropertyAnimation
{
    /**
     * Set up and start the animation.
     * @param {Object} manager - The instance of the AnimationManager class.
     * @param {Object} guiObject
     * @param {string} propertyName
     * @param {Object} propertyValues
     * @param {Object} configuration
     * @param {Object} handlers
     */
	constructor(manager, guiObject, propertyName, propertyValues, configuration, handlers)
	{
		this.manager = manager;
		this.guiObject = guiObject;
		this.propertyName = propertyName;

		this.factor = 0;
		this.hasStarted = false;

		this.curve = configuration.curve;
		this.duration = configuration.duration;
		this.startTime = Date.now() + configuration.delay;
		this.endTime = this.startTime + this.duration;
		this.handlers = handlers;

		this.targetState = propertyValues;
        this.originalState = this.manager.animatableProperties[propertyName].get(this.guiObject);
		this.stateDifference = {};
		this.determineStateDifference();
	}


    /**
     * Calculate and cache the difference of each property value.
     */
	determineStateDifference()
	{
		for (const key of this.manager.animatableProperties[this.propertyName].values)
			this.stateDifference[key] = this.targetState[key] - this.originalState[key];;
	}

    /**
     * Called by the ObjectAnimation instance that called this class into existence.
     * @param {number} currentTime
     */
	onTick(currentTime)
	{
		if (currentTime < this.startTime)
			return;

		if (!this.hasStarted)
		{
			this.hasStarted = true;
			this.handlers.onStart();
		}
		if (currentTime > this.endTime)
		{
			this.complete();
			return;
		}

		this.recalculateFactor(currentTime);
		this.updateValues();
		this.handlers.onTick();
	}

    /**
     * Recalculate the factor in accordance to the current progress in the animation.
     * @param {number} absoluteTime
     */
	recalculateFactor(absoluteTime)
	{
		const uniformTime = (absoluteTime - this.startTime) / this.duration;
		this.factor = this.manager.animationCurves[this.curve](uniformTime);
	}

    /**
     * Write the new values to the GUI object. This must not be done anywhere else to.
     */
	updateValues()
	{
		let updatedState = {};
		for (const key of this.manager.animatableProperties[this.propertyName].values)
		{
			updatedState[key] = this.originalState[key] + this.factor * this.stateDifference[key];
			if (this.manager.animatableProperties[this.propertyName].roundToIntegers)
				updatedState[key] = Math.round(updatedState[key]);
		}

		this.manager.animatableProperties[this.propertyName].set(this.guiObject, updatedState);
	}

    /**
     * Immediately skip to the end of the animation as if it had finished on its own.
     */
	complete()
	{
		this.manager.animatableProperties[this.propertyName].set(this.guiObject, this.targetState);
		// Ensure that onComplete is only called AFTER destructing this instance.
		// If not, it could register a new animation that might overwrite this one and then get immediately discard by the folliwng destruction command.
		// It's completely safe to do stuff after this instance has been "destroyed" (detached from the ObjectAnimation); garbage collection doesn't happen instantly anyway.
		this.destruct();
		this.handlers.onComplete();
	}

    /**
     * Merciless, cold-blooded self-destruction.
     */
	destruct()
	{
		this.manager.removePropertyAnimation(this.guiObject, this.propertyName);
	}
}