/**
 * System component to store the victory conditions and their settings and
 * check for allied victory / last-man-standing.
 */
function EndGameManager() {
	/**
	 * Contains settings specific to the victory condition,
	 * for example wonder victory duration.
	 * @type {VictorySettings}
	 */
	//@ts-expect-error
	this.gameSettings = {};

	// Allied victory means allied players can win if victory conditions are met for each of them
	// False for a "last man standing" game
	this.alliedVictory = true;

	// Don't do any checks before the diplomacies were set for each player
	// or when marking a player as won.
	this.skipAlliedVictoryCheck = true;

	this.lastManStandingMessage = undefined;

	this.endlessGame = false;
}

EndGameManager.prototype.Schema =
	"<a:component type='system'/><empty/>";

EndGameManager.prototype.Init = function()
{
};

EndGameManager.prototype.GetGameSettings = function()
{
	return this.gameSettings;
};

EndGameManager.prototype.GetVictoryConditions = function()
{
	return this.gameSettings.victoryConditions;
};

/**
 * @typedef {{ victoryConditions: string[], relicCount?: number, relicDuration?: number, wonderDuration?: number, regicideGarrison?: boolean }} VictorySettings
 * @param {VictorySettings} newSettings
 */
EndGameManager.prototype.SetGameSettings = function(newSettings = { victoryConditions: [] })
{
	this.gameSettings = newSettings;
	this.skipAlliedVictoryCheck = false;
	this.endlessGame = !this.gameSettings.victoryConditions.length;

	Engine.BroadcastMessage(MT_VictoryConditionsChanged, {});
};

/**
 * Sets the given player (and the allies if allied victory is enabled) as a winner.
 *
 * @param {number} playerID - The player that should win.
 * @param {function} victoryString - Function that maps from number to plural string, for example
 *   n => markForPluralTranslation(
 *       "%(lastPlayer)s has won (game mode).",
 *       "%(players)s and %(lastPlayer)s have won (game mode).",
 *       n));
 * @param {function} defeatString - Function that maps from number to plural string, for
 */
EndGameManager.prototype.MarkPlayerAndAlliesAsWon = function(playerID, victoryString, defeatString)
{
	const cmpPlayer = /** @type {Player} */(QueryPlayerIDInterface(playerID, IID_Player));
	if (!cmpPlayer.IsActive())
	{
		warn("Can't mark player " + playerID + " as won, since the state is " + cmpPlayer.GetState());
		return;
	}

	let winningPlayers = [playerID];
	if (this.alliedVictory)
		winningPlayers = /** @type {Diplomacy} */(QueryPlayerIDInterface(playerID, IID_Diplomacy)).GetMutualAllies().filter(
			player => /** @type {Player} */(QueryPlayerIDInterface(player, IID_Player)).IsActive());

	this.MarkPlayersAsWon(winningPlayers, victoryString, defeatString);
};

/**
 * Sets the given players as won and others as defeated.
 *
 * @param {number[]} winningPlayers - The players that should win.
 * @param {function} victoryString - Function that maps from number to plural string, for example
 *   n => markForPluralTranslation(
 *       "%(lastPlayer)s has won (game mode).",
 *       "%(players)s and %(lastPlayer)s have won (game mode).",
 *       n));
 * @param {function} defeatString - Function that maps from number to plural string, for example
 */
EndGameManager.prototype.MarkPlayersAsWon = function(winningPlayers, victoryString, defeatString)
{
	this.skipAlliedVictoryCheck = true;
	for (let playerID of winningPlayers)
	{
		let cmpPlayer = /** @type {Player} */(QueryPlayerIDInterface(playerID, IID_Player));
		if (!cmpPlayer.IsActive())
		{
			warn("Can't mark player " + playerID + " as won, since the state is " + cmpPlayer.GetState());
			continue;
		}
		cmpPlayer.Win(undefined);
	}

	let defeatedPlayers = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager).GetActivePlayers().filter(
		playerID => winningPlayers.indexOf(playerID) == -1);

	for (let playerID of defeatedPlayers)
		/** @type {Player} */(QueryPlayerIDInterface(playerID, IID_Player)).Defeat(undefined);

	let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"type": "won",
		"players": [winningPlayers[0]],
		"allies": winningPlayers,
		"message": victoryString(winningPlayers.length)
	});

	if (defeatedPlayers.length)
		cmpGUIInterface.PushNotification({
			"type": "defeat",
			"players": [defeatedPlayers[0]],
			"allies": defeatedPlayers,
			"message": defeatString(defeatedPlayers.length)
		});

	this.skipAlliedVictoryCheck = false;
};

/** @param {boolean} flag */
EndGameManager.prototype.SetAlliedVictory = function(flag)
{
	this.alliedVictory = flag;
};

EndGameManager.prototype.GetAlliedVictory = function()
{
	return this.alliedVictory;
};

EndGameManager.prototype.AlliedVictoryCheck = function()
{
	if (this.skipAlliedVictoryCheck || this.endlessGame)
		return;

	let cmpGuiInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	if (this.lastManStandingMessage)
		cmpGuiInterface.DeleteTimeNotification(this.lastManStandingMessage);

	// Proceed if only allies are remaining
	let allies = [];
	let numPlayers = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager).GetNumPlayers();
	for (let playerID = 1; playerID < numPlayers; ++playerID)
	{
		let cmpPlayer = /** @type {Player} */(QueryPlayerIDInterface(playerID, IID_Player));
		if (!cmpPlayer.IsActive())
			continue;

		if (allies.length && !/** @type {Diplomacy} */(QueryPlayerIDInterface(playerID, IID_Diplomacy)).IsMutualAlly(allies[0]))
			return;

		allies.push(playerID);
	}

	if (!allies.length)
		return;

	if (this.alliedVictory || allies.length == 1)
	{
		for (const playerID of allies)
			QueryPlayerIDInterface(playerID, IID_Player)?.Win(undefined);

		cmpGuiInterface.PushNotification({
			"type": "won",
			"players": [allies[0]],
			"allies": allies,
			"message": markForPluralTranslation(
				"%(lastPlayer)s has won (last player alive).",
				"%(players)s and %(lastPlayer)s have won (last players alive).",
				allies.length)
		});
	}
	else
		this.lastManStandingMessage = cmpGuiInterface.AddTimeNotification({
			"message": markForTranslation("Last remaining player wins."),
			"translateMessage": true,
		}, 12 * 60 * 60 * 1000); // 12 hours
};

/** @param {MessageInitGame} msg */
EndGameManager.prototype.OnInitGame = function(msg)
{
	this.AlliedVictoryCheck();
};

/** @param {MessageDiplomacyChanged} msg */
EndGameManager.prototype.OnGlobalDiplomacyChanged = function(msg)
{
	this.AlliedVictoryCheck();
};

/** @param {MessagePlayerDefeated} msg */
EndGameManager.prototype.OnGlobalPlayerDefeated = function(msg)
{
	this.AlliedVictoryCheck();
};

Engine.RegisterSystemComponentType(IID_EndGameManager, "EndGameManager", EndGameManager);
