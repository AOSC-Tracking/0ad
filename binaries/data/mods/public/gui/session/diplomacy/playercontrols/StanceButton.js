/**
 * This class provides one button per diplomatic stance for a given player.
 */
DiplomacyDialogPlayerControl.prototype.StanceButtonManager = class
{
	constructor(playerID)
	{
		this.COOLDOWN_MS = 3500;
		this.lastStanceChangeTime = 0; // unix-epoch ms of last click

		this.buttons = this.Stances.map(stance =>
			new this.StanceButton(playerID, stance, this));
	}

	update(playerInactive)
	{
		const hidden = playerInactive || GetSimState().ceasefireActive || g_Players[g_ViewedPlayer].teamLocked;
		const cooldownActive = Date.now() - this.lastStanceChangeTime < this.COOLDOWN_MS;

		for (const button of this.buttons)
			button.update(hidden, cooldownActive);
	}

	/**
	 * Called immediately after a stance button is pressed.
	 */
	notifyStanceChange()
	{
		this.lastStanceChangeTime = Date.now();
	}
};

DiplomacyDialogPlayerControl.prototype.StanceButtonManager.prototype.Stances = ["Ally", "Neutral", "Enemy"];

/**
 * This class manages a button that if pressed, will change the diplomatic stance to the given player to the given stance.
 */
DiplomacyDialogPlayerControl.prototype.StanceButtonManager.prototype.StanceButton = class
{
	constructor(playerID, stance, manager)
	{
		this.playerID = playerID;
		this.stance = stance;
		this.manager = manager; // back-reference to parent

		const idx = playerID - 1;
		this.button = Engine.GetGUIObjectByName("diplomacyPlayer" + stance         + "[" + idx + "]");
		this.label  = Engine.GetGUIObjectByName("diplomacyPlayer" + stance + "Txt" + "[" + idx + "]");

		this.button.onPress = this.onPress.bind(this);
	}

	update(hidden, cooldownActive)
	{
		const isCurrentStance = g_Players[g_ViewedPlayer]["is" + this.stance][this.playerID];
		this.button.hidden = hidden || !controlsPlayer(g_ViewedPlayer) ||  isCurrentStance || cooldownActive;
		this.label.hidden  = hidden || !controlsPlayer(g_ViewedPlayer) || !isCurrentStance;

		const caption = isCurrentStance ?
			translateWithContext("diplomatic stance selection", this.StanceSelection) :
			"";

		this.button.caption = this.button.hidden ? "" : caption;
		this.label.caption  = this.label.hidden  ? "" : caption;
	}

	onPress()
	{
		// start the cool-down immediately
		if (this.manager)
			this.manager.notifyStanceChange();

		Engine.PostNetworkCommand({
			"type": "diplomacy",
			"player": this.playerID,
			"to": this.stance.toLowerCase()
		});
	}
};

DiplomacyDialogPlayerControl.prototype.StanceButtonManager.prototype.StanceButton.prototype.StanceSelection =
	markForTranslationWithContext("diplomatic stance selection", "x");
