/**
 * Contains the layout and button settings per selection panel
 *
 * getItems returns a list of basic items used to fill the panel.
 * This method is obligated. If the items list is empty, the panel
 * won't be rendered.
 *
 * Then there's a loop over all items provided. In the loop,
 * the item and some other standard data is added to a data object.
 *
 * The standard data is
 * {
 *   "i":              index
 *   "item":           item coming from the getItems function
 *   "playerState":    playerState
 *   "unitEntStates":  states of the selected entities
 *   "rowLength":      rowLength
 *   "numberOfItems":  number of items that will be processed
 *   "button":         gui Button object
 *   "icon":           gui Icon object
 *   "guiSelection":   gui button Selection overlay
 *   "countDisplay":   gui caption space
 * }
 *
 * Then for every data object, the setupButton function is called which
 * sets the view and handlers of the button.
 */

// Cache some formation info
// Available formations per player
var g_AvailableFormations = new Map();
var g_FormationsInfo = new Map();

var g_SelectionPanels = {};

var g_SelectionPanelBarterButtonManager;

g_SelectionPanels.Alert = {
	"getMaxNumberOfItems": function()
	{
		return 2;
	},
	"getItems": function(unitEntStates)
	{
		return unitEntStates.some(state => !!state.alertRaiser) ? ["raise", "end"] : [];
	},
	"setupButton": function(data)
	{
		data.button.onPress = function() {
			switch (data.item)
			{
			case "raise":
				raiseAlert();
				return;
			case "end":
				endOfAlert();
				return;
			default:
				error("Unknown value for alert action: " + data.item);
			}
		};

		switch (data.item)
		{
		case "raise":
			data.icon.sprite = "stretched:session/icons/bell_level1.png";
			data.button.tooltip = translate("Raise an alert!");
			if (data.unitEntStates.every(state => MatchesClassList(["Civilian"], state.alertRaiser?.classes)))
				data.button.tooltip += "\n" + bodyFont(translate("Alert nearby Civilians to seek refuge."));
			else if (data.unitEntStates.every(state => MatchesClassList(["Trader"], state.alertRaiser?.classes)))
				data.button.tooltip += "\n" + bodyFont(translate("Alert nearby Traders to seek refuge."));
			else
				data.button.tooltip += "\n" + bodyFont(translate("Alert nearby vulnerable units to seek refuge."));
			break;
		case "end":
			data.icon.sprite = "stretched:session/icons/bell_level0.png";
			data.button.tooltip = translate("End the alert.");
			if (data.unitEntStates.every(state => MatchesClassList(["Civilian"], state.alertRaiser?.classes)))
				data.button.tooltip += "\n" + bodyFont(translate("Unload nearby Civilians."));
			else if (data.unitEntStates.every(state => MatchesClassList(["Trader"], state.alertRaiser?.classes)))
				data.button.tooltip += "\n" + bodyFont(translate("Unload nearby Traders."));
			else
				data.button.tooltip += "\n" + bodyFont(translate("Unload nearby vulnerable units."));
			break;
		default:
			error("Unknown value for alert action: " + data.item);
		}
		data.button.enabled = controlsPlayer(data.player);

		setPanelObjectPosition(data.button, this.getMaxNumberOfItems() - data.i, data.rowLength);
		return true;
	}
};

g_SelectionPanels.Barter = {
	"getMaxNumberOfItems": function()
	{
		return 5;
	},
	"rowLength": 5,
	"conflictsWith": ["Garrison"],
	"getItems": function(unitEntStates)
	{
		// If more than `rowLength` resources, don't display icons.
		if (unitEntStates.every(state => !state.isBarterMarket) || g_ResourceData.GetBarterableCodes().length > this.rowLength)
			return [];
		return g_ResourceData.GetBarterableCodes();
	},
	"setupButton": function(data)
	{
		if (g_SelectionPanelBarterButtonManager)
		{
			g_SelectionPanelBarterButtonManager.setViewedPlayer(data.player);
			g_SelectionPanelBarterButtonManager.update();
		}
		return true;
	}
};

g_SelectionPanels.Command = {
	"getMaxNumberOfItems": function()
	{
		return 6;
	},
	"getItems": function(unitEntStates)
	{
		const commands = [];

		for (const command in g_EntityCommands)
		{
			const info = getCommandInfo(command, unitEntStates);
			if (info)
			{
				info.name = command;
				commands.push(info);
			}
		}
		return commands;
	},
	"setupButton": function(data)
	{
		data.button.tooltip = data.item.tooltip;

		data.button.onPress = function() {
			if (data.item.callback)
				data.item.callback(data.item);
			else
				performCommand(data.unitEntStates, data.item.name);
		};

		data.countDisplay.caption = data.item.count || "";

		data.button.enabled = data.item.enabled == true;

		data.icon.sprite = "stretched:session/icons/" + data.item.icon;

		const left = (data.i - data.numberOfItems / 2) * (data.button.size.bottom + 1);
		Object.assign(data.button.size, {
			// relative to the center ( = 50%)
			"rleft": 50,
			"rright": 50,
			// offset from the center calculation, count on square buttons, so size.bottom is the width too
			"left": left,
			"right": left + data.button.size.bottom
		});

		return true;
	}
};

g_SelectionPanels.Construction = {
	"getMaxNumberOfItems": function()
	{
		return 40 - getNumberOfRightPanelButtons();
	},
	"rowLength": 10,
	"getItems": function()
	{
		return getAllBuildableEntitiesFromSelection();
	},
	"setupButton": function(data)
	{
		const template = GetTemplateData(data.item, data.player);
		if (!template)
			return false;

		const requirementsMet = Engine.GuiInterfaceCall("AreRequirementsMet", {
			"requirements": template.requirements,
			"player": data.player
		});

		let neededResources;
		if (template.cost)
			neededResources = Engine.GuiInterfaceCall("GetNeededResources", {
				"cost": multiplyEntityCosts(template, 1),
				"player": data.player
			});

		data.button.onPress = function() { startBuildingPlacement(data.item, data.playerState); };
		const showTemplateFunc = () => { showTemplateDetails(data.item, data.playerState.civ); };
		data.button.onPressRight = showTemplateFunc;
		data.button.onPressRightDisabled = showTemplateFunc;

		const tooltips = [
			getEntityNamesFormatted,
			getVisibleEntityClassesFormatted,
			getAurasTooltip,
			getEntityTooltip
		].map(func => func(template));
		tooltips.push(
			getEntityCostTooltip(template, data.player),
			getResourceDropsiteTooltip(template),
			getGarrisonTooltip(template),
			getTurretsTooltip(template),
			getPopulationBonusTooltip(template),
			getTemplateViewerOnRightClickTooltip(template)
		);


		const limits = getEntityLimitAndCount(data.playerState, data.item);
		tooltips.push(
			formatLimitString(limits.entLimit, limits.entCount, limits.entLimitChangers),
			formatMatchLimitString(limits.matchLimit, limits.matchCount, limits.type),
			getRequirementsTooltip(requirementsMet, template.requirements, GetSimState().players[data.player].civ),
			getNeededResourcesTooltip(neededResources));

		data.button.tooltip = tooltips.filter(tip => tip).join("\n");

		let modifier = "";
		if (!requirementsMet || limits.canBeAddedCount == 0)
		{
			data.button.enabled = false;
			modifier += "color:0 0 0 127:grayscale:";
		}
		else if (neededResources)
		{
			data.button.enabled = false;
			modifier += resourcesToAlphaMask(neededResources) + ":";
		}
		else
			data.button.enabled = controlsPlayer(data.player);

		if (template.icon)
			data.icon.sprite = modifier + "stretched:session/portraits/" + template.icon;

		setPanelObjectPosition(data.button, data.i + getNumberOfRightPanelButtons(), data.rowLength);
		return true;
	}
};

g_SelectionPanels.Formation = {
	"getMaxNumberOfItems": function()
	{
		return 15;
	},
	"rowLength": 5,
	"conflictsWith": ["Garrison"],
	"getItems": function(unitEntStates)
	{
		if (unitEntStates.some(state => !hasClass(state, "Unit")))
			return [];

		if (unitEntStates.every(state => !state.unitAI || !state.unitAI.formations.length))
			return [];

		if (!g_AvailableFormations.has(unitEntStates[0].player))
			g_AvailableFormations.set(unitEntStates[0].player, Engine.GuiInterfaceCall("GetAvailableFormations", unitEntStates[0].player));

		return g_AvailableFormations.get(unitEntStates[0].player).filter(formation => unitEntStates.some(state => !!state.unitAI && state.unitAI.formations.includes(formation)));
	},
	"setupButton": function(data)
	{
		if (!g_FormationsInfo.has(data.item))
			g_FormationsInfo.set(data.item, Engine.GuiInterfaceCall("GetFormationInfoFromTemplate", { "templateName": data.item }));

		const formationOk = canMoveSelectionIntoFormation(data.item);
		const unitIds = data.unitEntStates.map(state => state.id);
		const formationSelected = Engine.GuiInterfaceCall("IsFormationSelected", {
			"ents": unitIds,
			"formationTemplate": data.item
		});

		data.button.onPress = function() {
			performFormation(unitIds, data.item);
		};

		data.button.onMouseRightPress = () => g_AutoFormation.setDefault(data.item);

		const formationInfo = g_FormationsInfo.get(data.item);
		let tooltip = translate(formationInfo.name);
		if (formationInfo.tooltip)
			tooltip += "\n" + bodyFont(translate(formationInfo.tooltip));

		const isDefaultFormation = g_AutoFormation.isDefault(data.item);
		if (data.item === NULL_FORMATION)
			tooltip += "\n" + (isDefaultFormation ?
				translate("Default formation is disabled.") :
				translate("Right-click to disable the default formation feature."));
		else
			tooltip += "\n" + (isDefaultFormation ?
				translate("This is the default formation, used for movement orders.") :
				translate("Right-click to set this as the default formation."));

		if (!formationOk && formationInfo.disabledTooltip)
			tooltip += "\n" + objectionFont(translate(formationInfo.disabledTooltip));
		data.button.tooltip = tooltip;

		data.button.enabled = formationOk && controlsPlayer(data.player);
		const grayscale = formationOk ? "" : "grayscale:";
		data.guiSelection.hidden = !formationSelected;
		data.countDisplay.hidden = !isDefaultFormation;
		data.icon.sprite = "stretched:" + grayscale + "session/icons/" + formationInfo.icon;

		setPanelObjectPosition(data.button, data.i, data.rowLength);
		return true;
	}
};

g_SelectionPanels.Garrison = {
	"getMaxNumberOfItems": function()
	{
		return 12;
	},
	"rowLength": 4,
	"conflictsWith": ["Barter"],
	"getItems": function(unitEntStates)
	{
		if (unitEntStates.every(state => !state.garrisonHolder))
			return [];

		const groups = new EntityGroups();

		for (const state of unitEntStates)
			if (state.garrisonHolder)
				groups.add(state.garrisonHolder.entities);

		return groups.getEntsGrouped();
	},
	"setupButton": function(data)
	{
		const entState = GetEntityState(data.item.ents[0]);

		const template = GetTemplateData(entState.template);
		if (!template)
			return false;

		data.button.onPress = function() {
			unloadTemplate(template.selectionGroupName || entState.template, entState.player);
		};

		data.countDisplay.caption = data.item.ents.length > 1 ? data.item.ents.length : "";

		const canUngarrison = controlsPlayer(data.player) || controlsPlayer(entState.player);

		data.button.enabled = canUngarrison;

		data.button.tooltip = (canUngarrison ?
			sprintf(translate("Unload %(name)s"), { "name": getEntityNames(template) }) + "\n" +
			translate("Single-click to unload 1. Shift-click to unload all of this type.") :
			getEntityNames(template)) + "\n" +
			sprintf(translate("Player: %(playername)s"), {
				"playername": g_Players[entState.player].name
			});

		data.guiSelection.sprite = "color:" + g_DiplomacyColors.getPlayerColor(entState.player, 160);
		data.button.sprite_disabled = data.button.sprite;

		// Selection panel buttons only appear disabled if they
		// also appear disabled to the owner of the structure.
		data.icon.sprite =
			(canUngarrison || g_IsObserver ? "" : "grayscale:") +
			"stretched:session/portraits/" + template.icon;

		setPanelObjectPosition(data.button, data.i, data.rowLength);

		return true;
	}
};

g_SelectionPanels.Gate = {
	"getMaxNumberOfItems": function()
	{
		return 40 - getNumberOfRightPanelButtons();
	},
	"rowLength": 10,
	"getItems": function(unitEntStates)
	{
		const hideLocked = unitEntStates.every(state => !state.gate || !state.gate.locked);
		const hideUnlocked = unitEntStates.every(state => !state.gate || state.gate.locked);

		if (hideLocked && hideUnlocked)
			return [];

		return [
			{
				"hidden": hideLocked,
				"tooltip": translate("Lock Gate"),
				"icon": "session/icons/lock_locked.png",
				"locked": true
			},
			{
				"hidden": hideUnlocked,
				"tooltip": translate("Unlock Gate"),
				"icon": "session/icons/lock_unlocked.png",
				"locked": false
			}
		];
	},
	"setupButton": function(data)
	{
		data.button.onPress = function() { lockGate(data.item.locked); };
		data.button.tooltip = data.item.tooltip;
		data.button.enabled = controlsPlayer(data.player);
		data.guiSelection.hidden = data.item.hidden;
		data.icon.sprite = "stretched:" + data.item.icon;

		setPanelObjectPosition(data.button, data.i + getNumberOfRightPanelButtons(), data.rowLength);
		return true;
	}
};

g_SelectionPanels.Pack = {
	"getMaxNumberOfItems": function()
	{
		return 40 - getNumberOfRightPanelButtons();
	},
	"rowLength": 10,
	"getItems": function(unitEntStates)
	{
		const checks = {};
		for (const state of unitEntStates)
		{
			if (!state.pack)
				continue;

			if (state.pack.progress == 0)
			{
				if (state.pack.packed)
					checks.unpackButton = true;
				else
					checks.packButton = true;
			}
			else if (state.pack.packed)
				checks.unpackCancelButton = true;
			else
				checks.packCancelButton = true;
		}

		const items = [];
		if (checks.packButton)
			items.push({
				"packing": false,
				"packed": false,
				"tooltip": translate("Pack"),
				"callback": function() { packUnit(true); }
			});

		if (checks.unpackButton)
			items.push({
				"packing": false,
				"packed": true,
				"tooltip": translate("Unpack"),
				"callback": function() { packUnit(false); }
			});

		if (checks.packCancelButton)
			items.push({
				"packing": true,
				"packed": false,
				"tooltip": translate("Cancel Packing"),
				"callback": function() { cancelPackUnit(true); }
			});

		if (checks.unpackCancelButton)
			items.push({
				"packing": true,
				"packed": true,
				"tooltip": translate("Cancel Unpacking"),
				"callback": function() { cancelPackUnit(false); }
			});

		return items;
	},
	"setupButton": function(data)
	{
		data.button.onPress = function() {data.item.callback(data.item); };

		data.button.tooltip = data.item.tooltip;

		if (data.item.packing)
			data.icon.sprite = "stretched:session/icons/cancel.png";
		else if (data.item.packed)
			data.icon.sprite = "stretched:session/icons/unpack.png";
		else
			data.icon.sprite = "stretched:session/icons/pack.png";

		data.button.enabled = controlsPlayer(data.player);

		setPanelObjectPosition(data.button, data.i + getNumberOfRightPanelButtons(), data.rowLength);
		return true;
	}
};

g_SelectionPanels.Queue = {
	"getMaxNumberOfItems": function()
	{
		return 16;
	},
	/**
	 * Returns a list of all items in the productionqueue of the selection
	 * The first entry of every entity's production queue will come before
	 * the second entry of every entity's production queue
	 */
	"getItems": function(unitEntStates)
	{
		const queue = [];
		let foundNew = true;
		for (let i = 0; foundNew; ++i)
		{
			foundNew = false;
			for (const state of unitEntStates)
			{
				if (!state.production || !state.production.queue[i])
					continue;
				queue.push({
					"producingEnt": state.id,
					"queuedItem": state.production.queue[i],
					"autoqueue": state.production.autoqueue && state.production.queue[i].unitTemplate,
				});
				foundNew = true;
			}
		}
		if (!queue.length)
			return queue;
		// Add 'ghost' items to show autoqueues.
		const repeat = [];
		for (const item of queue)
			if (item.autoqueue)
			{
				const ghostItem = clone(item);
				ghostItem.ghost = true;
				repeat.push(ghostItem);
			}
		if (repeat.length)
			for (let i = 0; queue.length < g_SelectionPanels.Queue.getMaxNumberOfItems(); ++i)
				queue.push(repeat[i % repeat.length]);
		return queue;
	},
	"resizePanel": function(numberOfItems, rowLength)
	{
		const numRows = Math.ceil(numberOfItems / rowLength);
		const panel = Engine.GetGUIObjectByName("unitQueuePanel");
		const buttonSize = Engine.GetGUIObjectByName("unitQueueButton[0]").size.bottom;
		const margin = 4;
		panel.size.top = panel.size.bottom - numRows * buttonSize - (numRows + 2) * margin;
	},
	"setupButton": function(data)
	{
		const queuedItem = data.item.queuedItem;

		// Differentiate between units and techs
		let template;
		if (queuedItem.unitTemplate)
			template = GetTemplateData(queuedItem.unitTemplate);
		else if (queuedItem.technologyTemplate)
			template = GetTechnologyData(queuedItem.technologyTemplate, GetSimState().players[data.player].civ);
		else
		{
			warning("Unknown production queue template " + uneval(queuedItem));
			return false;
		}
		data.button.onPress = function() { removeFromProductionQueue(data.item.producingEnt, queuedItem.id); };

		const tooltips = [getEntityNames(template)];
		if (data.item.ghost)
			tooltips.push(translate("The auto-queue will try to train this item later."));
		if (queuedItem.neededSlots)
		{
			tooltips.push(objectionFont(translate("Insufficient population capacity:")));
			tooltips.push(sprintf(translate("%(population)s %(neededSlots)s"), {
				"population": resourceIcon("population"),
				"neededSlots": queuedItem.neededSlots
			}));
		}
		tooltips.push(getTemplateViewerOnRightClickTooltip(template));
		data.button.tooltip = tooltips.join("\n");

		data.countDisplay.caption = queuedItem.count > 1 ? queuedItem.count : "";

		const progressSlider = Engine.GetGUIObjectByName("unitQueueProgressSlider[" + data.i + "]");
		if (data.item.ghost)
		{
			data.button.enabled = false;
			progressSlider.sprite = "color:0 150 250 50";

			// Buttons are assumed to be square, so left/right offsets can be used for top/bottom.
			progressSlider.size.top = progressSlider.size.left;
		}
		else
		{
			// Show the time remaining to finish the first item
			if (data.i == 0)
				Engine.GetGUIObjectByName("queueTimeRemaining").caption =
					Engine.FormatMillisecondsIntoDateStringGMT(queuedItem.timeRemaining, translateWithContext("countdown format", "m:ss"));

			progressSlider.sprite = "queueProgressSlider";

			// Buttons are assumed to be square, so left/right offsets can be used for top/bottom.
			progressSlider.size.top = progressSlider.size.left + Math.round(queuedItem.progress * (progressSlider.size.right - progressSlider.size.left));

			data.button.enabled = controlsPlayer(data.player);

			Engine.GetGUIObjectByName("unitQueuePausedIcon[" + data.i + "]").hidden = !queuedItem.paused;
			if (queuedItem.paused)
				// Translation: String displayed when the research is paused. E.g. by being garrisoned or when not the first item in the queue.
				data.button.tooltip += "\n" + translate("This item is paused.");
		}

		if (template.icon)
		{
			let modifier = "stretched:";
			if (queuedItem.paused)
				modifier += "color:0 0 0 127:grayscale:";
			else if (data.item.ghost)
				modifier += "grayscale:";
			data.icon.sprite = modifier + "session/portraits/" + template.icon;
		}


		const showTemplateFunc = () => { showTemplateDetails(data.item.queuedItem.unitTemplate || data.item.queuedItem.technologyTemplate, data.playerState.civ); };
		data.button.onPressRight = showTemplateFunc;
		data.button.onPressRightDisabled = showTemplateFunc;

		setPanelObjectPosition(data.button, data.i, data.rowLength);
		return true;
	}
};

g_SelectionPanels.Research = {
	"getMaxNumberOfItems": function()
	{
		return 10;
	},
	"rowLength": 10,
	"reset": function()
	{
		this.helper.occupiedPositions = new Set();
		this.helper.bottomRowButtonCount = 0;
	},
	"getItems": function(unitEntStates)
	{
		if (getNumberOfRightPanelButtons() >= this.rowLength * 2)
			return [];

		let ret = [];
		if (unitEntStates.length == 1)
		{
			const entState = unitEntStates[0];
			if (!entState?.researcher?.technologies)
				return ret;
			if (!entState.production)
				warn("Researcher without ProductionQueue found: " + entState.id + ".");
			return entState.researcher.technologies.map(tech => ({
				"tech": tech,
				"techCostMultiplier": entState.researcher.techCostMultiplier,
				"researchFacilityId": entState.id,
				"isUpgrading": !!entState.upgrade && entState.upgrade.isUpgrading
			}));
		}

		const sortedEntStates = unitEntStates.sort((a, b) =>
			(!b.upgrade || !b.upgrade.isUpgrading) - (!a.upgrade || !a.upgrade.isUpgrading) ||
			(!a.production ? 0 : a.production.queue.length) - (!b.production ? 0 : b.production.queue.length)
		);

		for (const state of sortedEntStates)
		{
			if (!state.researcher || !state.researcher.technologies)
				continue;
			if (!state.production)
				warn("Researcher without ProductionQueue found: " + state.id + ".");

			// Remove the techs we already have in ret (with the same name and techCostMultiplier)
			const filteredTechs = state.researcher.technologies.filter(
				tech => tech != null && !ret.some(
					item =>
						(item.tech == tech ||
							item.tech.pair &&
							tech.pair &&
							item.tech.second == tech.second &&
							item.tech.first == tech.first) &&
						Object.keys(item.techCostMultiplier).every(
							k => item.techCostMultiplier[k] == state.researcher.techCostMultiplier[k])
				));

			if (filteredTechs.length + ret.length <= this.getMaxNumberOfItems())
				ret = ret.concat(filteredTechs.map(tech => ({
					"tech": tech,
					"techCostMultiplier": state.researcher.techCostMultiplier,
					"researchFacilityId": state.id,
					"isUpgrading": !!state.upgrade && state.upgrade.isUpgrading
				})));
		}
		return ret;
	},
	"hideItem": function(i, rowLength) // Called when no item is found
	{
		Engine.GetGUIObjectByName("unitResearchButton[" + i + "]").hidden = true;
		// Remove the button it would have been paired with as well.
		Engine.GetGUIObjectByName("unitResearchButton[" + (i + this.getMaxNumberOfItems()) + "]").hidden = true;
	},
	"setupButton": function(data)
	{
		if (!data.item.tech)
		{
			g_SelectionPanels.Research.hideItem(data.i, data.rowLength);
			return false;
		}

		const playerState = GetSimState().players[data.player];

		if (data.item.tech.pair)
		{
			const firstTemplate = clone(GetTechnologyData(data.item.tech.first, playerState.civ));
			const secondTemplate = clone(GetTechnologyData(data.item.tech.second, playerState.civ));
			let [firstPosition, secondPosition] = this.helper.findPreferredPositionsOfPair(data.player, firstTemplate.placeBelow, secondTemplate.placeBelow, data.rowLength);

			// There are twice as many button objects than this.getMaxNumberOfItems()
			// This is because each item could be a tech pair and need a second one in addition to the one at data.i
			// Also, the button indices here aren't related to positioning at all.
			const firstButtonIndex = data.i;
			const secondButtonIndex = data.i + this.getMaxNumberOfItems();
			const firstButton = data.button;
			const secondButton = Engine.GetGUIObjectByName("unitResearchButton[" + secondButtonIndex + "]");
			const firstIcon = data.icon;
			const secondIcon = Engine.GetGUIObjectByName("unitResearchIcon[" + secondButtonIndex + "]");

			const chosenPlacement =
				firstPosition !== -1 && secondPosition !== -1 ?
					(firstPosition % data.rowLength) === (secondPosition % data.rowLength) ?
						this.helper.techPairPlacement.VERTICAL_TOP : this.helper.techPairPlacement.HORIZONTAL_TOP :
					this.helper.occupiedPositions.has(this.helper.bottomRowButtonCount + data.rowLength) || getNumberOfRightPanelButtons() >= data.rowLength ?
						this.helper.techPairPlacement.HORIZONTAL_BOTTOM : this.helper.techPairPlacement.HORIZONTAL_BOTTOM;

			const isPlacedVertically = chosenPlacement === this.helper.techPairPlacement.VERTICAL_TOP || chosenPlacement === this.helper.techPairPlacement.VERTICAL_BOTTOM;
			const isPlacedBelowUnit = chosenPlacement === this.helper.techPairPlacement.VERTICAL_TOP || chosenPlacement === this.helper.techPairPlacement.HORIZONTAL_TOP;


			if (chosenPlacement === this.helper.techPairPlacement.VERTICAL_BOTTOM)
			{
				firstPosition = this.helper.bottomRowButtonCount + data.rowLength; // Place in the third (second-to-bottom) row.
				secondPosition = this.helper.bottomRowButtonCount + data.rowLength * 2; // Place in the fourth (bottom) row.
			}
			else if (chosenPlacement === this.helper.techPairPlacement.HORIZONTAL_BOTTOM)
			{
				// Place both in the second row, next to each other.
				firstPosition = this.helper.bottomRowButtonCount + data.rowLength * 2;
				secondPosition = firstPosition + 1;
			}

			const firstButtonVisible = this.helper.doVisibilityCheck(firstButton, firstTemplate, firstPosition, data.rowLength);
			const secondButtonVisible = this.helper.doVisibilityCheck(secondButton, secondTemplate, secondPosition, data.rowLength);
			const bothButtonsVisible = firstButtonVisible && secondButtonVisible;

			if (!firstButtonVisible && !secondButtonVisible)
				return false;

			// Handle cases where one of the buttons isn't visible.
			if (chosenPlacement === this.helper.techPairPlacement.VERTICAL_TOP && !firstButtonVisible && secondButtonVisible)
				secondPosition = firstPosition; // Move the bottom button up to the second row.
			else if (chosenPlacement === this.helper.techPairPlacement.VERTICAL_BOTTOM && firstButtonVisible && !secondButtonVisible)
				firstPosition = secondPosition; // Move the top button down to the fourth (bottom) row.

			if (firstButtonVisible)
			{
				this.helper.buildButton(playerState, data, firstButton, firstIcon, data.item.tech.first, firstTemplate, firstPosition);
				this.helper.buildAffectsIcon(firstButtonIndex, isPlacedBelowUnit, firstButton.enabled);
			}
			if (secondButtonVisible)
			{
				this.helper.buildButton(playerState, data, secondButton, secondIcon, data.item.tech.second, secondTemplate, secondPosition);
				this.helper.buildAffectsIcon(secondButtonIndex, isPlacedBelowUnit && (!isPlacedVertically || !firstButtonVisible), secondButton.enabled);
			}

			this.helper.buildPairIcon(false, firstButtonIndex, bothButtonsVisible && !isPlacedVertically && secondPosition > firstPosition, firstButton.enabled);
			this.helper.buildPairIcon(false, secondButtonIndex, bothButtonsVisible && !isPlacedVertically && secondPosition < firstPosition, secondButton.enabled);
			this.helper.buildPairIcon(true, firstButtonIndex, bothButtonsVisible && isPlacedVertically, firstButton.enabled);
			this.helper.buildPairIcon(true, secondButtonIndex, false, secondButton.enabled);

			if (bothButtonsVisible)
			{
				// While hovering over either button, show a cross over the other one.
				// TODO: The following few lines have to be executed only once, technically, and not every this function is called.
				const firstUnchosenIcon = Engine.GetGUIObjectByName("unitResearchUnchosenIcon[" + firstButtonIndex + "]");
				const secondUnchosenIcon = Engine.GetGUIObjectByName("unitResearchUnchosenIcon[" + secondButtonIndex + "]");
				firstButton.onMouseEnter = () => { secondUnchosenIcon.hidden = false; };
				firstButton.onMouseLeave = () => { secondUnchosenIcon.hidden = true; };
				secondButton.onMouseEnter = () => { firstUnchosenIcon.hidden = false; };
				secondButton.onMouseLeave = () => { firstUnchosenIcon.hidden = true; };
			}

			return true;
		}

		// The item is not a tech pair. So hide the button that data.button would have been paired with.
		Engine.GetGUIObjectByName("unitResearchButton[" + (data.i + this.getMaxNumberOfItems()) + "]").hidden = true;

		const template = clone(GetTechnologyData(data.item.tech, playerState.civ));

		let position = this.helper.findPreferredPosition(data.player, template.placeBelow, data.rowLength);
		const usePreferredPosition = position >= 0;
		Engine.GetGUIObjectByName("unitResearchVerticalPairIcon[" + data.i + "]").hidden = true;
		Engine.GetGUIObjectByName("unitResearchHorizontalPairIcon[" + data.i + "]").hidden = true;

		if (!usePreferredPosition)
			position = this.helper.bottomRowButtonCount + data.rowLength * 2; // Fall back to the fourth (bottom) row.

		if (!this.helper.doVisibilityCheck(data.button, template, position, data.rowLength))
			return false;

		this.helper.buildButton(playerState, data, data.button, data.icon, data.item.tech, template, position);
		this.helper.buildAffectsIcon(data.i, usePreferredPosition, data.button.enabled);
		return true;
	},
	"helper": {
		// Techs can optionally define a placeBelow attribute mentioning a unit class which they affect and whose training button they want to be placed below.
		// This is in particular done for unit-specific techs.

		// Tech pairs can be placed in following four arrangements (with descending preference):
		// 		1. VERTICAL_TOP - Vertically below a single unit.
		// 		2. HORIZONTAL_TOP - Horizontally below two adjacent units.
		// 		3. VERTICAL_BOTTOM - Vertically below no unit in the third and fourth rows.
		//		4. HORIZONTAL_BOTTOM - Horizontally adjacent in the bottom row.
		"techPairPlacement": {
			"VERTICAL_TOP": 1,
			"HORIZONTAL_TOP": 2,
			"VERTICAL_BOTTOM": 3,
			"HORIZONTAL_BOTTOM": 4
		},

		// Note: The GUI object container of the research buttons (unlike the one of the training buttons) only reaches up to the second row.
		// This means that, for example, a research button with position 5 is located directly one row under a training button with position 5.
		"findTargetTrainingButton": function(player, placeBelow, rowLength)
		{
			// Also check whether the other right panel buttons (training, constructing, upgrading) reach the second row.
			// In that case, we want to place all techs in the bottom row. Research buttons should never be placed in the same row as these.
			if (!placeBelow || getNumberOfRightPanelButtons() > rowLength)
				return -1;

			const targetClassList = [placeBelow.split(" ")];

			const index = getAllTrainableEntitiesFromSelection().findIndex(
				trainableTemplate => MatchesClassList(GetTemplateData(trainableTemplate, player).visibleIdentityClasses, targetClassList)
			);
			if (index == -1)
				return index;

			// Make sure to account for the other buttons placed before the unit training ones.
			return index + ["Construction", "Pack", "Gate", "Upgrade"].reduce((total, panel) => total + g_unitPanelButtons[panel], 0);

		},
		"findPreferredPosition": function(player, placeBelow, rowLength) {
			let position = this.findTargetTrainingButton(player, placeBelow, rowLength);
			if (this.occupiedPositions.has(position))
			{
			// Try to fall back to the third (second-to-bottom) row.

				if (this.occupiedPositions.has(position + rowLength))
				// Both positions below the target unit are already used by other techs.
				// Note: Ideally this should never occur. Two techs per unit should be the limit. This here is just edge case handling.
					return -1;
				position += rowLength;
			}

			return position;
		},
		"findPreferredPositionsOfPair": function(player, firstPlaceBelow, secondPlaceBelow, rowLength)
		{
			let firstPosition = this.findTargetTrainingButton(player, firstPlaceBelow, rowLength);
			let secondPosition = this.findTargetTrainingButton(player, secondPlaceBelow, rowLength);

			if (firstPosition == -1 || secondPosition == -1 ||
				// Only place either below a unit, if the other can be too and below the same or an adjacent one.
				Math.abs(firstPosition - secondPosition) > 1)
				return [-1, -1];

			if (firstPosition === secondPosition)
			{
				// Both are placed under the same unit.
				if (this.occupiedPositions.has(firstPosition) || this.occupiedPositions.has(firstPosition + rowLength))
					// At least one of the two positions under the unit is occupied.
					return [-1, -1];

				//  Move the second one down to the third (second-to-bottom) row, below the first one.
				secondPosition += rowLength;
			}
			else if (this.occupiedPositions.has(firstPosition) || this.occupiedPositions.has(secondPosition))
			{
				if (this.occupiedPositions.has(firstPosition + rowLength) || this.occupiedPositions.has(secondPosition + rowLength))
					// Neither the two positions in the second row nor the third row below the target training buttons are available.
					return [-1, -1];

				// At least one of the two respective positions in the second (third-to-bottom) row is occupied. So move both to the third.
				firstPosition += rowLength;
				secondPosition += rowLength;
			}

			return [firstPosition, secondPosition];
		},
		"doVisibilityCheck": function(button, template, position, rowLength) {
		// template.reqs is false if the tech isn't researchable by the current civ.
			if (!template || !template.reqs || position >= rowLength * 3)
			{
				button.hidden = true;
				return false;
			}
			return true;
		},
		"buildAffectsIcon": function(i, show, enable) {
			const icon = Engine.GetGUIObjectByName("unitResearchAffectsIcon[" + i + "]");
			icon.hidden = !show;
			if (!icon.hidden)
				icon.sprite = "stretched:session/icons/" + (enable ? "tech_affects.png" : "tech_affects_disabled.png");
		},
		"buildPairIcon": function(vertical, i, show, enable) {
			const icon = Engine.GetGUIObjectByName("unitResearch" + (vertical ? "Vertical" : "Horizontal") + "PairIcon[" + i + "]");
			icon.hidden = !show;
			if (!icon.hidden)
				icon.sprite = "stretched:session/icons/" +
					(vertical ?
						enable ? "vertical_tech_pair.png" : "vertical_tech_pair_disabled.png" :
						enable ? "horizontal_tech_pair.png" : "horizontal_tech_pair_disabled.png");
		},
		"buildButton": function(playerState, baseData, button, icon, techName, template, position) {
			for (const res in template.cost)
				template.cost[res] *= baseData.item.techCostMultiplier[res] !== undefined ? baseData.item.techCostMultiplier[res] : 1;

			const neededResources = Engine.GuiInterfaceCall("GetNeededResources", {
				"cost": template.cost,
				"player": baseData.player
			});

			const requirementsPassed = Engine.GuiInterfaceCall("CheckTechnologyRequirements", {
				"tech": techName,
				"player": baseData.player
			});

			const tooltips = [
				getEntityNamesFormatted,
				getEntityTooltip,
				getEntityCostTooltip,
				getTemplateViewerOnRightClickTooltip
			].map(func => func(template));

			if (!requirementsPassed)
			{
				let tip = template.requirementsTooltip;
				const reqs = template.reqs;
				for (const req of reqs)
				{
					if (!req.entities)
						continue;

					const entityCounts = [];
					for (const entity of req.entities)
					{
						let current = 0;
						switch (entity.check)
						{
						case "count":
							current = playerState.classCounts[entity.class] || 0;
							break;

						case "variants":
							current = playerState.typeCountsByClass[entity.class] ?
								Object.keys(playerState.typeCountsByClass[entity.class]).length : 0;
							break;
						default:
							error("Unknow value in entity requirement check: " + entity.check);
						}

						const remaining = entity.number - current;
						if (remaining < 1)
							continue;

						entityCounts.push(sprintf(translatePlural("%(number)s entity of class %(class)s", "%(number)s entities of class %(class)s", remaining), {
							"number": remaining,
							"class": translate(entity.class)
						}));
					}

					tip += " " + sprintf(translate("Remaining: %(entityCounts)s"), {
						"entityCounts": entityCounts.join(translateWithContext("Separator for a list of entity counts", ", "))
					});
				}
				tooltips.push(objectionFont(tip));
			}
			tooltips.push(getNeededResourcesTooltip(neededResources));
			button.tooltip = tooltips.filter(tip => tip).join("\n");

			button.onPress = (t => function() {
				addResearchToQueue(baseData.item.researchFacilityId, t);
			})(techName);

			const showTemplateFunc = (t => function() {
				showTemplateDetails(
					t,
					GetTemplateData(baseData.unitEntStates.find(state => state.id == baseData.item.researchFacilityId).template).nativeCiv);
			});

			button.onPressRight = showTemplateFunc(techName);
			button.onPressRightDisabled = showTemplateFunc(techName);

			button.hidden = false;
			let modifier = "";
			if (!requirementsPassed)
			{
				button.enabled = false;
				modifier += "color:0 0 0 127:grayscale:";
			}
			else if (neededResources)
			{
				button.enabled = false;
				modifier += resourcesToAlphaMask(neededResources) + ":";
			}
			else
				button.enabled = controlsPlayer(baseData.player);

			if (baseData.item.isUpgrading)
			{
				button.enabled = false;
				modifier += "color:0 0 0 127:grayscale:";
				button.tooltip += "\n" + objectionFont(translate("Cannot research while upgrading."));
			}

			if (template.icon)
				icon.sprite = modifier + "stretched:session/portraits/" + template.icon;

			this.occupiedPositions.add(position);
			if (position >= 2 * baseData.rowLength)
				this.bottomRowButtonCount++;

			setPanelObjectPosition(button, position, baseData.rowLength);
		}
	}
};

g_SelectionPanels.Selection = {
	"getMaxNumberOfItems": function()
	{
		return 16;
	},
	"rowLength": 4,
	"getItems": function(unitEntStates)
	{
		if (unitEntStates.length < 2)
			return [];
		return g_Selection.groups.getEntsGrouped();
	},
	"setupButton": function(data)
	{
		const entState = GetEntityState(data.item.ents[0]);
		const template = GetTemplateData(entState.template);
		if (!template)
			return false;

		for (const ent of data.item.ents)
		{
			const state = GetEntityState(ent);

			if (state.resourceCarrying && state.resourceCarrying.length !== 0)
			{
				if (!data.carried)
					data.carried = {};
				const carrying = state.resourceCarrying[0];
				if (data.carried[carrying.type])
					data.carried[carrying.type] += carrying.amount;
				else
					data.carried[carrying.type] = carrying.amount;
			}

			if (state.trader && state.trader.goods && state.trader.goods.amount)
			{
				if (!data.carried)
					data.carried = {};
				const amount = state.trader.goods.amount;
				const type = state.trader.goods.type;
				let totalGain = amount.traderGain;
				if (amount.market1Gain)
					totalGain += amount.market1Gain;
				if (amount.market2Gain)
					totalGain += amount.market2Gain;
				if (data.carried[type])
					data.carried[type] += totalGain;
				else
					data.carried[type] = totalGain;
			}
		}

		const unitOwner = GetEntityState(data.item.ents[0]).player;
		let tooltip = getEntityNames(template);
		if (data.carried)
			tooltip += "\n" + Object.keys(data.carried).map(res =>
				resourceIcon(res) + data.carried[res]
			).join(" ");
		if (g_IsObserver)
			tooltip += "\n" + sprintf(translate("Player: %(playername)s"), {
				"playername": g_Players[unitOwner].name
			});
		data.button.tooltip = tooltip;

		data.guiSelection.sprite = "color:" + g_DiplomacyColors.getPlayerColor(unitOwner, 160);
		data.guiSelection.hidden = !g_IsObserver;

		data.countDisplay.caption = data.item.ents.length > 1 ? data.item.ents.length : "";

		data.button.onPress = function() {
			if (Engine.HotkeyIsPressed("session.deselectgroup"))
				removeFromSelectionGroup(data.item.key);
			else
				makePrimarySelectionGroup(data.item.key);
		};
		data.button.onPressRight = function() { removeFromSelectionGroup(data.item.key); };

		if (template.icon)
			data.icon.sprite = "stretched:session/portraits/" + template.icon;

		setPanelObjectPosition(data.button, data.i, data.rowLength);
		return true;
	}
};

g_SelectionPanels.Stance = {
	"getMaxNumberOfItems": function()
	{
		return 5;
	},
	"getItems": function(unitEntStates)
	{
		if (unitEntStates.some(state => !state.unitAI || !hasClass(state, "Unit") || hasClass(state, "Animal")))
			return [];

		return unitEntStates[0].unitAI.selectableStances;
	},
	"setupButton": function(data)
	{
		const unitIds = data.unitEntStates.map(state => state.id);
		data.button.onPress = function() { performStance(unitIds, data.item); };

		data.button.tooltip = getStanceDisplayName(data.item) + "\n" + bodyFont(getStanceTooltip(data.item));

		data.guiSelection.hidden = !Engine.GuiInterfaceCall("IsStanceSelected", {
			"ents": unitIds,
			"stance": data.item
		});
		data.icon.sprite = "stretched:session/icons/stances/" + data.item + ".png";
		data.button.enabled = controlsPlayer(data.player);

		setPanelObjectPosition(data.button, data.i, data.rowLength);
		return true;
	}
};

g_SelectionPanels.Training = {
	"getMaxNumberOfItems": function()
	{
		return 40 - getNumberOfRightPanelButtons();
	},
	"rowLength": 10,
	"getItems": function()
	{
		return getAllTrainableEntitiesFromSelection();
	},
	"setupButton": function(data)
	{
		const template = GetTemplateData(data.item, data.player);
		if (!template)
			return false;

		const requirementsMet = Engine.GuiInterfaceCall("AreRequirementsMet", {
			"requirements": template.requirements,
			"player": data.player
		});

		const unitIds = data.unitEntStates.map(status => status.id);
		const [buildingsCountToTrainFullBatch, fullBatchSize, remainderBatch] =
			getTrainingStatus(unitIds, data.item, data.playerState);

		const trainNum = buildingsCountToTrainFullBatch * fullBatchSize + remainderBatch;

		let neededResources;
		if (template.cost)
			neededResources = Engine.GuiInterfaceCall("GetNeededResources", {
				"cost": multiplyEntityCosts(template, trainNum),
				"player": data.player
			});

		data.button.onPress = function() {
			if (!neededResources)
				addTrainingToQueue(unitIds, data.item, data.playerState);
		};

		const showTemplateFunc = () => { showTemplateDetails(data.item, data.playerState.civ); };
		data.button.onPressRight = showTemplateFunc;
		data.button.onPressRightDisabled = showTemplateFunc;

		data.countDisplay.caption = trainNum > 1 ? trainNum : "";

		let tooltips = [
			"[font=\"sans-bold-16\"]" +
				colorizeHotkey("%(hotkey)s", "session.queueunit." + (data.i + 1)) +
				"[/font]" + " " + getEntityNamesFormatted(template),
			getVisibleEntityClassesFormatted(template),
			getAurasTooltip(template),
			getEntityTooltip(template),
			getEntityCostTooltip(template, data.player, unitIds[0], buildingsCountToTrainFullBatch, fullBatchSize, remainderBatch)
		];
		const limits = getEntityLimitAndCount(data.playerState, data.item);
		tooltips.push(formatLimitString(limits.entLimit, limits.entCount, limits.entLimitChangers),
			formatMatchLimitString(limits.matchLimit, limits.matchCount, limits.type));

		if (Engine.ConfigDB_GetValue("user", "showdetailedtooltips") === "true")
			tooltips = tooltips.concat([
				getHealthTooltip,
				getAttackTooltip,
				getHealerTooltip,
				getResistanceTooltip,
				getGarrisonTooltip,
				getTurretsTooltip,
				getProjectilesTooltip,
				getSpeedTooltip,
				getResourceDropsiteTooltip
			].map(func => func(template)));

		tooltips.push(getTemplateViewerOnRightClickTooltip());
		tooltips.push(
			formatBatchTrainingString(buildingsCountToTrainFullBatch, fullBatchSize, remainderBatch),
			getRequirementsTooltip(requirementsMet, template.requirements, GetSimState().players[data.player].civ),
			getNeededResourcesTooltip(neededResources));

		data.button.tooltip = tooltips.filter(tip => tip).join("\n");

		let modifier = "";
		if (!requirementsMet || limits.canBeAddedCount == 0)
		{
			data.button.enabled = false;
			modifier = "color:0 0 0 127:grayscale:";
		}
		else
		{
			data.button.enabled = controlsPlayer(data.player);
			if (neededResources)
				modifier = resourcesToAlphaMask(neededResources) + ":";
		}

		if (data.unitEntStates.every(state => state.upgrade && state.upgrade.isUpgrading))
		{
			data.button.enabled = false;
			modifier = "color:0 0 0 127:grayscale:";
			data.button.tooltip += "\n" + objectionFont(translate("Cannot train while upgrading."));
		}

		if (template.icon)
			data.icon.sprite = modifier + "stretched:session/portraits/" + template.icon;

		const index = data.i + getNumberOfRightPanelButtons();
		setPanelObjectPosition(data.button, index, data.rowLength);

		return true;
	}
};

g_SelectionPanels.Upgrade = {
	"getMaxNumberOfItems": function()
	{
		return 40 - getNumberOfRightPanelButtons();
	},
	"rowLength": 10,
	"getItems": function(unitEntStates)
	{
		// Interface becomes complicated with multiple different units and this is meant per-entity, so prevent it if the selection has multiple different units.
		if (unitEntStates.some(state => state.template != unitEntStates[0].template))
			return false;

		return unitEntStates[0].upgrade && unitEntStates[0].upgrade.upgrades;
	},
	"setupButton": function(data)
	{
		const template = GetTemplateData(data.item.entity);
		if (!template)
			return false;

		const progressOverlay = Engine.GetGUIObjectByName("unitUpgradeProgressSlider[" + data.i + "]");
		progressOverlay.hidden = true;

		const requirementsMet = !data.item.requirements ||
			Engine.GuiInterfaceCall("AreRequirementsMet", {
				"requirements": data.item.requirements,
				"player": data.player
			});

		const limits = getEntityLimitAndCount(data.playerState, data.item.entity);
		const upgradingEntStates = data.unitEntStates.filter(state => state.upgrade.template == data.item.entity);

		const upgradableEntStates = data.unitEntStates.filter(state =>
			!state.upgrade.progress &&
			(!state.production || !state.production.queue || !state.production.queue.length));

		const neededResources = data.item.cost && Engine.GuiInterfaceCall("GetNeededResources", {
			"cost": multiplyEntityCosts(data.item, upgradableEntStates.length),
			"player": data.player
		});

		let tooltip;
		let modifier = "";
		if (!upgradingEntStates.length && upgradableEntStates.length)
		{
			const primaryName = g_SpecificNamesPrimary ? template.name.specific : template.name.generic;
			let secondaryName;
			if (g_ShowSecondaryNames)
				secondaryName = g_SpecificNamesPrimary ? template.name.generic : template.name.specific;

			const tooltips = [];
			if (g_ShowSecondaryNames)
			{
				if (data.item.tooltip)
					tooltips.push(sprintf(translate("Upgrade to a %(primaryName)s (%(secondaryName)s). %(tooltip)s"), {
						"primaryName": primaryName,
						"secondaryName": secondaryName,
						"tooltip": translate(data.item.tooltip)
					}));
				else
					tooltips.push(sprintf(translate("Upgrade to a %(primaryName)s (%(secondaryName)s)."), {
						"primaryName": primaryName,
						"secondaryName": secondaryName
					}));
			}
			else
			{
				if (data.item.tooltip)
					tooltips.push(sprintf(translate("Upgrade to a %(primaryName)s. %(tooltip)s"), {
						"primaryName": primaryName,
						"tooltip": translate(data.item.tooltip)
					}));
				else
					tooltips.push(sprintf(translate("Upgrade to a %(primaryName)s."), {
						"primaryName": primaryName
					}));
			}

			tooltips.push(
				getEntityCostTooltip(data.item, undefined, undefined, data.unitEntStates.length),
				formatLimitString(limits.entLimit, limits.entCount, limits.entLimitChangers),
				formatMatchLimitString(limits.matchLimit, limits.matchCount, limits.type),
				getRequirementsTooltip(requirementsMet, data.item.requirements, GetSimState().players[data.player].civ),
				getNeededResourcesTooltip(neededResources),
				getTemplateViewerOnRightClickTooltip()
			);

			tooltip = tooltips.filter(tip => tip).join("\n");

			data.button.onPress = function() {
				upgradeEntity(
					data.item.entity,
					upgradableEntStates.map(state => state.id));
			};

			if (!requirementsMet || limits.canBeAddedCount == 0 &&
				!upgradableEntStates.some(state => hasSameRestrictionCategory(data.item.entity, state.template)))
			{
				data.button.enabled = false;
				modifier = "color:0 0 0 127:grayscale:";
			}
			else if (neededResources)
			{
				data.button.enabled = false;
				modifier = resourcesToAlphaMask(neededResources) + ":";
			}

			data.countDisplay.caption = upgradableEntStates.length > 1 ? upgradableEntStates.length : "";
		}
		else if (upgradingEntStates.length)
		{
			tooltip = translate("Cancel Upgrading");
			data.button.onPress = function() { cancelUpgradeEntity(); };
			data.countDisplay.caption = upgradingEntStates.length > 1 ? upgradingEntStates.length : "";

			let progress = 0;
			for (const state of upgradingEntStates)
				progress = Math.max(progress, state.upgrade.progress || 1);

			// TODO This is bad: we assume the progressOverlay is square
			progressOverlay.size.top = progressOverlay.size.bottom + Math.round((1 - progress) * (progressOverlay.size.left - progressOverlay.size.right));
			progressOverlay.hidden = false;
		}
		else
		{
			tooltip = objectionFont(translatePlural(
				"Cannot upgrade when the entity is training, researching or already upgrading.",
				"Cannot upgrade when all entities are training, researching or already upgrading.",
				data.unitEntStates.length));

			data.button.onPress = function() {};

			data.button.enabled = false;
			modifier = "color:0 0 0 127:grayscale:";
		}
		data.button.enabled = controlsPlayer(data.player);
		data.button.tooltip = tooltip;

		const showTemplateFunc = () => { showTemplateDetails(data.item.entity, data.playerState.civ); };
		data.button.onPressRight = showTemplateFunc;
		data.button.onPressRightDisabled = showTemplateFunc;

		data.icon.sprite = modifier + "stretched:session/" +
			(data.item.icon || "portraits/" + template.icon);

		setPanelObjectPosition(data.button, data.i + getNumberOfRightPanelButtons(), data.rowLength);
		return true;
	}
};

function initSelectionPanels()
{

	const unitBarterPanel = Engine.GetGUIObjectByName("unitBarterPanel");
	if (BarterButtonManager.IsAvailable(unitBarterPanel))
		g_SelectionPanelBarterButtonManager = new BarterButtonManager(unitBarterPanel);
}

/**
 * Pauses game and opens the template details viewer for a selected entity or technology.
 *
 * Technologies don't have a set civ, so we pass along the native civ of
 * the template of the entity that's researching it.
 *
 * @param {string} [civCode] - The template name of the entity that researches the selected technology.
 */
async function showTemplateDetails(templateName, civCode)
{
	if (inputState != INPUT_NORMAL)
		return;
	g_PauseControl.implicitPause();

	await Engine.OpenChildPage(
		"page_viewer.xml",
		{
			"templateName": templateName,
			"civ": civCode
		});
	resumeGame();
}

/**
 * If two panels need the same space, so they collide,
 * the one appearing first in the order is rendered.
 *
 * Note that the panel needs to appear in the list to get rendered.
 */
const g_PanelsOrder = [
	// LEFT PANE
	"Barter", // Must always be visible on markets
	"Garrison", // More important than Formation, as you want to see the garrisoned units in ships
	"Alert",
	"Formation",
	"Stance", // Normal together with formation

	// RIGHT PANE
	"Gate", // Must always be shown on gates
	"Pack", // Must always be shown on packable entities
	"Upgrade", // Must always be shown on upgradable entities
	"Training",
	"Construction",
	"Research", // Normal together with training

	// UNIQUE PANES (importance doesn't matter)
	"Command",
	"Queue",
	"Selection",
];
