/**
 * This class sets up a shortcut to a specific entity in the GUI panel.
 * The button shows the portrait a tooltip with state information and a health and/or capture bar.
 * Clicking the button selects and jumps to to the entity.
 */
class PanelEntity
{
	constructor(selection, entityID, buttonID, orderKey)
	{
		this.selection = selection;
		this.hitpoints = undefined;
		this.capturePoints = undefined;

		/**
		 * Public property
		 */
		this.entityID = entityID;

		/**
		 * Public property
		 */
		this.orderKey = orderKey;

		this.blinkingAnimation = new PanelEntityBlinking("panelEntityHitOverlay[" + buttonID + "]", this.BlinkingColors.gray, this.BlinkingColors.red, this.BlinkingFrequency);

		this.panelEntityHealthBar = Engine.GetGUIObjectByName("panelEntityHealthBar[" + buttonID + "]");
		this.panelEntityCaptureBar = Engine.GetGUIObjectByName("panelEntityCapture[" + buttonID + "]");
		this.panelEntButton = Engine.GetGUIObjectByName("panelEntityButton[" + buttonID + "]");
		this.panelEntButton.onPress = this.onPress.bind(this);
		this.panelEntButton.onDoublePress = this.onDoublePress.bind(this);
		this.panelEntButton.hidden = false;

		let entityState = GetEntityState(entityID);
		let template = GetTemplateData(entityState.template);
		this.nameTooltip = setStringTags(g_SpecificNamesPrimary ? template.name.specific : template.name.generic, this.NameTags) + "\n";

		Engine.GetGUIObjectByName("panelEntityHealthSection[" + buttonID + "]").hidden = !entityState.hitpoints;

		let captureSection = Engine.GetGUIObjectByName("panelEntityCaptureSection[" + buttonID + "]");
		captureSection.hidden = !entityState.capturePoints;
		if (entityState.capturePoints)
		{
			this.capturePoints = entityState.capturePoints;
			if (!entityState.hitpoints)
				captureSection.size = Engine.GetGUIObjectByName("panelEntitySectionPosTop[" + buttonID + "]").size;
		}

		Engine.GetGUIObjectByName("panelEntityImage[" + buttonID + "]").sprite =
			"stretched:" + this.PortraitDirectory + template.icon;
	}

	destroy()
	{
		this.panelEntButton.hidden = true;
		this.blinkingAnimation.stop();
	}

	update(i, total, reposition)
	{
		if (reposition)
			this.reposition(i, total);

		let entityState = GetEntityState(this.entityID);
		this.updateHitpointsBar(entityState);
		this.updateCapturePointsBar(entityState);

		this.panelEntButton.tooltip =
			this.nameTooltip +
			this.Tooltips.map(tooltip => tooltip(entityState)).filter(tip => tip).join("\n");
	}

	reposition(i)
	{
		const margin = 1;
		let newSize = this.panelEntButton.size;
		const width = newSize.right - newSize.left;
		newSize.left = i * (width + margin) + margin;
		newSize.right = newSize.left + width;

		GuiAnimator.animateObjectProperties(this.panelEntButton,
			{ "size": newSize },
			{ "delay": i * this.SlideTime / 3, "duration": this.SlideTime, "curve": "ease-in-out-moderate" }
		);
	}

	updateHitpointsBar(entityState)
	{
		if (!entityState.hitpoints)
			return;

		if (this.hitpoints != entityState.hitpoints)
		{
			let size = this.panelEntityHealthBar.size;
			size.rright = 100 * entityState.hitpoints / entityState.maxHitpoints;
			this.panelEntityHealthBar.size = size;
		}
		if (entityState.hitpoints < this.hitpoints)
			this.onAttacked();
		this.hitpoints = entityState.hitpoints;
	}

	updateCapturePointsBar(entityState)
	{
		if (!entityState.capturePoints)
			return;

		let playerParts = this.panelEntityCaptureBar.children;
		let setCaptureBarPart = function(player, startSize) {
			let captureBar = playerParts[player];
			let size = captureBar.size;
			size.rleft = startSize;
			size.rright = startSize + 100 * Math.max(0, Math.min(1, entityState.capturePoints[player] / entityState.maxCapturePoints));
			captureBar.size = size;
			captureBar.sprite = "color:" + g_DiplomacyColors.getPlayerColor(player, 128);
			captureBar.hidden = false;
			return size.rright;
		};

		let size = setCaptureBarPart(entityState.player, 0);
		for (let i in entityState.capturePoints)
			if (i != entityState.player)
				size = setCaptureBarPart(i, size);

		if (entityState.capturePoints[entityState.player] < this.capturePoints[entityState.player])
			this.onAttacked();

		this.capturePoints = entityState.capturePoints;
	}

	onAttacked()
	{
		this.blinkingAnimation.start();
	}

	onPress()
	{
		if (!Engine.HotkeyIsPressed("selection.add"))
			this.selection.reset();

		this.selection.addList([this.entityID]);
	}

	onDoublePress()
	{
		this.selection.selectAndMoveTo(getEntityOrHolder(this.entityID));
	}
}

PanelEntity.prototype.NameTags = { "font": "sans-bold-16" };

PanelEntity.prototype.PortraitDirectory = "session/portraits/";

PanelEntity.prototype.Tooltips = [
	getCurrentHealthTooltip,
	getCurrentCaptureTooltip,
	getAttackTooltip,
	getResistanceTooltip,
	getEntityTooltip,
	getAurasTooltip
];

/**
 * The two colors oscillated back and forth when blinking.
 */
PanelEntity.prototype.BlinkingColors = {
	"red": { "r": 175, "g": 0, "b": 0, "a": 100 },
	"gray": { "r": 175, "g": 255, "b": 255, "a": 100 }
};

/**
 * Time between two "blinks" in milliseconds.
 */
PanelEntity.prototype.BlinkingFrequency = 500;

/**
 * Duration of the repositioning animation in milliseconds.
 */
PanelEntity.prototype.SlideTime = 500;
