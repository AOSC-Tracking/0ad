/**
 * This class is responsible for triggering events and firing handlers registered by the different panel classes.
 */

class EventManager
{
	constructor(page)
	{
		this.page = page;
	}
	/**
	 * Handlers are stored by the panel registering them.
	 */
	registerEventHandler(event, handler, panel)
	{
		if (!this.events[event].handlers.has(panel))
			this.events[event].handlers.set(panel, new Set());

		this.events[event].handlers.get(panel).add(handler);
	}

	unregisterEventHandler(event, handler, panel)
	{
		this.events[event].handlers.get(panel).delete(handler);

		if (!this.events[event].handlers.get(panel).size)
			this.events[event].handlers.delete(panel);
	}

	/**
	 * Called whenever a new state is set.
	 */
	fireEventHandlers(oldState, newState)
	{
		// Only fire handlers that were registered by a currently active panel.
		const activePanels = this.page.panelManager.getActivePanels();
		for (const event of Object.values(this.events))
			if (event.trigger(oldState, newState))
				for (let panel of activePanels)
					if (event.handlers.has(panel))
						for (let handler of event.handlers.get(panel))
							handler(newState);
	}
}

EventManager.prototype.events = {
	"onPageStateChange": {
		"trigger": (oldState, newState) => uneval(oldState) != uneval(newState),
		"handlers": new Map()
	},
	"onActiveLayerChange": {
		"trigger": (oldState, newState) => oldState.activeLayer != newState.activeLayer,
		"handlers": new Map()
	},
	"onActiveCategoryChange": {
		"trigger": (oldState, newState) => oldState.activeCategory != newState.activeCategory,
		"handlers": new Map()
	},
	"onActiveCivChange": {
		"trigger": (oldState, newState) => oldState.activeCiv != newState.activeCiv,
		"handlers": new Map()
	},
	"onActiveSubcategoryChange": {
		"trigger": (oldState, newState) => oldState.activeSubcategory != newState.activeSubcategory,
		"handlers": new Map()
	},
	"onActiveArticleChange": {
		"trigger": (oldState, newState) => oldState.activeArticle != newState.activeArticle,
		"handlers": new Map()
	}
};
