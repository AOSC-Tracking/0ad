/**
 * This class is responsible for creating, showing and hiding the GUI panels.
 * The page has three layers ("introduction", "selection", "article") with different panels active on each.
 */

class PanelManager
{
	constructor(page)
	{
		this.page = page;

		this.initializePanels();
	}

	initializePanels()
	{
		let panels = new Set();

		let activePanelsByLayer = {
			"introduction": new Set(),
			"selection": new Set(),
			"article": new Set()
		};

		for (let panel of this.panelData)
		{
			const panelClass = panel.class;
			const panelName = panelClass.name[0].toLowerCase() + panelClass.name.substring(1);
			this[panelName] = new panelClass(this.page);
			panels.add(this[panelName]);

			for (let layer of panel.activeOnLayers)
				activePanelsByLayer[layer].add(this[panelName]);
		}

		this.panels = Object.freeze(panels);
		this.activePanelsByLayer = Object.freeze(activePanelsByLayer);
		this.activePanels = panels;
	}

	updatePanelActivations(oldState, newState)
	{

		const prevActivePanels = this.activePanels;
		this.activePanels = this.activePanelsByLayer[newState.activeLayer];

		// Update the panels' visibility.
		for (let panel of this.panels)
		{
			if (this.activePanels.has(panel))
			{
				if (!prevActivePanels?.has(panel))
					panel.gui.hidden = false;
			}
			else
			{
				if (prevActivePanels?.has(panel))
					panel.gui.hidden = true;
			}
		}
	}

	getActivePanels()
	{
		return Object.freeze([...this.activePanels ]);
	}
}

PanelManager.prototype.panelData = new Set([
	{
		"class": NavigationPanel,
		"activeOnLayers": ["introduction", "selection", "article"]
	},
	{
		"class": IntroductionPanel,
		"activeOnLayers": ["introduction"]
	},
	{
		"class": SelectionPanel,
		"activeOnLayers": ["selection"]
	},
	{
		"class": ArticlePanel,
		"activeOnLayers": ["article"]
	}
]);
