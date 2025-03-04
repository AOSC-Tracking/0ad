/**
 * @file Simple API to animate GUI objects' properties.
 *
 * GUI objects can be passed to the API by a reference or their name.
 *
 * Properties can be animated independent from the other (with different durations, delay, curves, etc.)
 * When a new animation includes a property that is already animated, it overwrites the existing one.
 *
 * The following properties can be animated:
 * - "textcolor" -- only works on objects that can have text.
 * - "color" -- only works if the object property sprite is defined. It is set like this "color: R G B A"
 * - "size" -- works on all objects.
 *
 * Example for a "targetState":
 *      {
 *          "size":{
 *              "left": -200,
 *              "right": 200
 *          },
 *          "color": {
 *              "r": 234,
 *              "b": 100,
 *              "g": 0
 *          }
 *      }
 *
 * The available animation curves are (see AnimationManager.js)
 * - "linear"
 * - "ease-in"
 * - "ease-out"
 * - "ease-in-out-subtle"
 * - "ease-in-out-strong"
 *
 * See AnimationManager.js for the default animation configuration.
 */


/**
 * This class provides the API methods.
 */
class GuiAnimator
{
    /**
     * @param {Object|string} object - Reference to the GUI object already or only its name.
     * @returns {Object} - Reference to the GUI object.
     */
    static #getGuiObject(object)
    {
        return typeof object === "object" ? object : Engine.GetGUIObjectByName(object);
    }

	static get manager()
	{
		if (!this._manager)
			this._manager = new AnimationManager();

		return this._manager;
	}

    /**
     * Register an animation.
     * @param {Object|string} object
     * @param {Object} targetState - Determine which properties will be animated to which final values. Does not need to include all values of the properties. See the file description for an example.
     * @param {{r,g,b,a}} [targetState.color]
     * @param {{r,g,b,a}} [targetState.textcolor]
     * @param {{left,top,right,bottom,rleft,rtop,rright,rbottom}} targetState.size
     * @param {Object} [animationConfig]
     * @param {number} [animationConfig.duration]
     * @param {number} [animationConfig.delay]
     * @param {string} [animationConfig.curve]
     * @param {Object} [handlers]
     * @param {Function} [handlers.onStart]
     * @param {Function} [handlers.onTick]
     * @param {Function} [handlers.onComplete]
     */
	static animateObjectProperties(object, targetState, animationConfig, handlers)
	{
		for (const [propertyName, propertyValue] of Object.entries(targetState))
			this.manager.addPropertyAnimation(this.#getGuiObject(object), propertyName, propertyValue, animationConfig, handlers);
	}

    /**
     * Halt one or more currently animated properties on a given object.
     * Their values will stay as they are at this very moment.
     * @param {Object|string} object
     * @param {Array} propertyList - An array of strings, for example: ["size", "color"]
     */
	static haltAnimationOfObjectProperties(object, propertyList)
	{
		for (const property of propertyList)
			this.manager.removePropertyAnimation(this.#getGuiObject(object), property);
	}

    /**
     * Skip forward to the end of all animations on a given object and finish them as if they had done on their own.
     * E.g. this includes calling the OnComplete handler.
     * @param {Object|string} object
     */
	static completeAllAnimationsOnObject(object)
	{
		this.manager.removeObjectAnimation(this.#getGuiObject(object), true);
	}

    /**
     * Stop all animations running on a given object immediately and leave all properties as they currently are.
     * @param {Object|string} object
     */
	static haltAllAnimationsOnObject(object)
	{
		this.manager.removeObjectAnimation(this.#getGuiObject(object), false);
	}

    /**
     * Reset previously animated properties of a given object to their state before the last animation.
     * This method alone does not always cut it. In that case, the properties need to be reset manually. More caching would be overkill.
     * @param {Object|string} object
     */
	static revertLastAnimationsOnObject(object)
	{
		this.manager.applyLastUnanimatedObjectState(this.#getGuiObject(object));
	}

    /**
     * Stop all animations currently running on any object.
     */
	static stopAllAnimationsOnScreen()
	{
        this.manager.stopAllAnimations();
	}
}