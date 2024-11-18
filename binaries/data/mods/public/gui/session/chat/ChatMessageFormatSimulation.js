/**
 * These classes construct a chat message from simulation events initiated from the GuiInterface PushNotification method.
 */
class ChatMessageFormatSimulation
{
}

ChatMessageFormatSimulation.attack = class
{
	parse(msg)
	{
		if (msg.player != g_ViewedPlayer)
			return "";

		const message = msg.targetIsDomesticAnimal ?
			translate("%(icon)sYour livestock has been attacked by %(attacker)s!") :
			translate("%(icon)sYou have been attacked by %(attacker)s!");

		return {
			"text": sprintf(message, {
				"icon": '[icon="icon_focusattacked"]',
				"attacker": colorizePlayernameByID(msg.attacker)
			}),
			"callback": ((target, position) => function() {
				focusAttack({ "target": target, "position": position });
			})(msg.target, msg.position),
			"tooltip": translate("Click to focus on the attacked unit.")
		};
	}
};

ChatMessageFormatSimulation.barter = class
{
	parse(msg)
	{
		if (!g_IsObserver || Engine.ConfigDB_GetValue("user", "gui.session.notifications.barter") != "true")
			return "";

		const amountGiven = {};
		amountGiven[msg.resourceGiven] = msg.amountGiven;

		const amountGained = {};
		amountGained[msg.resourceGained] = msg.amountGained;

		return {
			"text": sprintf(translate("%(player)s bartered %(amountGiven)s for %(amountGained)s."), {
				"player": colorizePlayernameByID(msg.player),
				"amountGiven": getLocalizedResourceAmounts(amountGiven),
				"amountGained": getLocalizedResourceAmounts(amountGained)
			})
		};
	}
};

ChatMessageFormatSimulation.diplomacy = class
{
	parse(msg)
	{
		let messageType;

		if (g_IsObserver)
			messageType = "observer";
		else if (Engine.GetPlayerID() == msg.sourcePlayer)
			messageType = "active";
		else if (Engine.GetPlayerID() == msg.targetPlayer)
			messageType = "passive";
		else
			return "";

		return {
			"text": sprintf(translate(this.strings[messageType][msg.status]), {
				"player": colorizePlayernameByID(messageType == "active" ? msg.targetPlayer : msg.sourcePlayer),
				"player2": colorizePlayernameByID(messageType == "active" ? msg.sourcePlayer : msg.targetPlayer)
			})
		};
	}
};

ChatMessageFormatSimulation.diplomacy.prototype.strings = {
	"active": {
		"ally": markForTranslation("You are now allied with %(player)s."),
		"enemy": markForTranslation("You are now at war with %(player)s."),
		"neutral": markForTranslation("You are now neutral with %(player)s.")
	},
	"passive": {
		"ally": markForTranslation("%(player)s is now allied with you."),
		"enemy": markForTranslation("%(player)s is now at war with you."),
		"neutral": markForTranslation("%(player)s is now neutral with you.")
	},
	"observer": {
		"ally": markForTranslation("%(player)s is now allied with %(player2)s."),
		"enemy": markForTranslation("%(player)s is now at war with %(player2)s."),
		"neutral": markForTranslation("%(player)s is now neutral with %(player2)s.")
	}
};

ChatMessageFormatSimulation.phase = class
{
	parse(msg)
	{
		const notifyPhase = Engine.ConfigDB_GetValue("user", "gui.session.notifications.phase");
		if (notifyPhase == "none" || msg.player != g_ViewedPlayer && !g_IsObserver && !g_Players[msg.player].isMutualAlly[g_ViewedPlayer])
			return "";

		let message = "";
		if (notifyPhase == "all")
		{
			if (msg.phaseState == "started")
				message = translate("%(player)s is advancing to the %(phaseName)s.");
			else if (msg.phaseState == "aborted")
				message = translate("The %(phaseName)s of %(player)s has been aborted.");
		}
		if (msg.phaseState == "completed")
			message = translate("%(player)s has reached the %(phaseName)s.");

		return {
			"text": sprintf(message, {
				"player": colorizePlayernameByID(msg.player),
				"phaseName": getEntityNames(GetTechnologyData(msg.phaseName, g_Players[msg.player].civ))
			})
		};
	}
};

ChatMessageFormatSimulation.playerstate = class
{
	parse(msg)
	{
		if (!msg.message.pluralMessage)
			return {
				"text": sprintf(translate(msg.message), {
					"player": colorizePlayernameByID(msg.players[0])
				})
			};

		const mPlayers = msg.players.map(playerID => colorizePlayernameByID(playerID));
		const lastPlayer = mPlayers.pop();

		return {
			"text": sprintf(translatePlural(msg.message.message, msg.message.pluralMessage, msg.message.pluralCount), {
				// Translation: This comma is used for separating first to penultimate elements in an enumeration.
				"players": mPlayers.join(translate(", ")),
				"lastPlayer": lastPlayer
			})
		};
	}
};

/**
 * Optionally show all tributes sent in observer mode and tributes sent between allied players.
 * Otherwise, only show tributes sent directly to us, and tributes that we send.
 */
ChatMessageFormatSimulation.tribute = class
{
	parse(msg)
	{
		let message = "";
		if (msg.targetPlayer == Engine.GetPlayerID())
			message = translate("%(player)s has sent you %(amounts)s.");
		else if (msg.sourcePlayer == Engine.GetPlayerID())
			message = translate("You have sent %(player2)s %(amounts)s.");
		else if (Engine.ConfigDB_GetValue("user", "gui.session.notifications.tribute") == "true" &&
		        (g_IsObserver || g_InitAttributes.settings.LockTeams &&
		           g_Players[msg.sourcePlayer].isMutualAlly[Engine.GetPlayerID()] &&
		           g_Players[msg.targetPlayer].isMutualAlly[Engine.GetPlayerID()]))
			message = translate("%(player)s has sent %(player2)s %(amounts)s.");

		return {
			"text": sprintf(message, {
				"player": colorizePlayernameByID(msg.sourcePlayer),
				"player2": colorizePlayernameByID(msg.targetPlayer),
				"amounts": getLocalizedResourceAmounts(msg.amounts)
			})
		};
	}
};

ChatMessageFormatSimulation.flare = class
{
	// We don't need to check whether the player is supposed to see the flare as this function is only ever called in that case.
	parse(msg)
	{
		switch (Engine.ConfigDB_GetValue("user", "gui.session.notifications.flare"))
		{
		case "never":
			return "";

		case "observer":
			if (!g_IsObserver)
				return "";

		default:
			break;
		}

		return {
			"text": sprintf(translate("%(icon)s%(player)s has sent a flare."), {
				"icon": "[icon=\"icon_focusflare\" displace=\"0 1\"]",
				"player": colorizePlayernameByGUID(msg.guid)
			}),
			"callback": ((position) => function() {
				Engine.CameraMoveTo(position.x, position.z);
			})(msg.position),
			"tooltip": translate("Click to focus on the flare's location.")
		};
	}
};

ChatMessageFormatSimulation.heroDeath = class
{
	parse(msg)
	{
		const notificationType = Engine.ConfigDB_GetValue("user", "gui.session.notifications.herodeath");
		if (notificationType == "none" || (!g_Players[msg.player].isMutualAlly[g_ViewedPlayer] && !g_IsObserver))
			return "";

		const isMale = msg.heroData.phenotype == "male";
		const message = sprintf(
			isMale ?
				translate("%(player)s's hero %(heroName)s has fallen in battle.") :
				translate("%(player)s's heroine %(heroName)s has fallen in battle."),
			{
				"player": colorizePlayernameByID(msg.player),
				"heroName": msg.heroData.name
			}
		);
		const appendageList = this.strings[g_Players[msg.player].civ] || this.strings[g_CivData[g_Players[msg.player].civ].Culture];
		if (!appendageList || notificationType == "basic")
			return { "text": message };

		const messageAppendage = translate(
			isMale ?
				pickRandom(appendageList).masculine :
				pickRandom(appendageList).feminine
		);

		return { "text": (message + " " + messageAppendage) };
	}
};

ChatMessageFormatSimulation.heroDeath.prototype.strings = {
	"hele": [
		{
			"masculine": markForTranslation("His shade will be ferried across the river Styx by Charon."),
			"feminine": markForTranslation("Her shade will be ferried across the river Styx by Charon.")
		},
		{
			"masculine": markForTranslation("His shade will be led to the Elysian Fields by Hermes for his merits."),
			"feminine": markForTranslation("Her shade will be led to the Elysian Fields by Hermes for her merits.")
		},
		{
			"masculine": markForTranslation("His shade will pass by Cerberus into the underworld, never to return."),
			"feminine": markForTranslation("Her shade will pass by Cerberus into the underworld, never to return.")
		},
		{
			"masculine": markForTranslation("His shade will enter the realm of Hades."),
			"feminine": markForTranslation("Her shade will enter the realm of Hades.")
		},
		{
			"masculine": markForTranslation("His deeds will be judged by Minos, Radamanthus, and Aecus."),
			"feminine": markForTranslation("Her deeds will be judged by Minos, Radamanthus, and Aecus.")
		}
	],
	"celt": [
		{
			"masculine": markForTranslation("His shade will journey to the Antumnos."),
			"feminine": markForTranslation("Her shade will journey to the Antumnos.")
		},
		{
			"masculine": markForTranslation("Her shade will persist under the aegis of Erecura."),
			"feminine": markForTranslation("His shade will persist under the aegis of Erecura.")
		}
	],
	"cart": [
		{
			"masculine": markForTranslation("His shade will be guided to the afterlife by Melqart."),
			"feminine": markForTranslation("Her shade will be guided to the afterlife by Melqart.")
		}
	],
	"han": [
		{
			"masculine": markForTranslation("His shade will descend to the Yellow Springs."),
			"feminine": markForTranslation("Her shade will descend to the Yellow Springs.")
		},
		{
			"masculine": markForTranslation("His shade will cross the Naihe Bridge of Oblivion and drink from Meng Po's soup."),
			"feminine": markForTranslation("Her shade will cross the Naihe Bridge of Oblivion and drink from Meng Po's soup.")
		},
		{
			"masculine": markForTranslation("His shade will be escorted to King Yama by Oxhead and Horseface."),
			"feminine": markForTranslation("Her shade will be escorted to King Yama by Oxhead and Horseface.")
		}
	],
	"iber": [
		{
			"masculine": markForTranslation("His shade will henceforth be commanded and protected by Ataecina."),
			"feminine": markForTranslation("Her shade will henceforth be commanded and protected by Ataecina.")
		}
	],
	"egyp": [
		{
			"masculine": markForTranslation("His heart will be weighed against the feather of Ma'at."),
			"feminine": markForTranslation("Her heart will be weighed against the feather of Ma'at.")
		},
		{
			"masculine": markForTranslation("His shade awaits the final judgement of Osiris."),
			"feminine": markForTranslation("Her shade awaits the final judgement of Osiris.")
		}
	],
	"maur": [
		{
			"masculine": markForTranslation("His shade will be reborn according to his Karma."),
			"feminine": markForTranslation("Her shade will be reborn according to his Karma.")
		}
	],
	"pers": [
		{
			"masculine": markForTranslation("His shade will be reunited with Ahura Mazda."),
			"feminine": markForTranslation("Her shade will be reunited with Ahura Mazda.")
		},
		{
			"masculine": markForTranslation("His shade will face final judgement in three days at the Chinvat bridge."),
			"feminine": markForTranslation("Her shade will face final judgement in three days at the Chinvat bridge.")
		},
		{
			"masculine": markForTranslation("His deeds will be weighed on Mithra's scale."),
			"feminine": markForTranslation("Her deeds will be weighed on Mithra's scale.")
		},
		{
			"masculine": markForTranslation("His deeds will be weighed on Mithra's scale."),
			"feminine": markForTranslation("Her deeds will be weighed on Mithra's scale.")
		}
	],
	"ptol": [
		{
			"masculine": markForTranslation("His shade will travel into the underworld ruled by Serapis."),
			"feminine": markForTranslation("Her shade will travel into the underworld ruled by Serapis.")
		}
	],
	"rome": [
		{
			"masculine": markForTranslation("His shade will be ferried across the river Styx by Charon."),
			"feminine": markForTranslation("Her shade will be ferried across the river Styx by Charon.")
		},
		{
			"masculine": markForTranslation("His shade will be led to the Elysian Fields by Mercury for his merits."),
			"feminine": markForTranslation("Her shade will be led to the Elysian Fields by Mercury for her merits.")
		},
		{
			"masculine": markForTranslation("His shade will pass by Cerberus into the underworld, never to return."),
			"feminine": markForTranslation("Her shade will pass by Cerberus into the underworld, never to return.")
		},
		{
			"masculine": markForTranslation("His shade will enter the realm of Pluto."),
			"feminine": markForTranslation("Her shade will enter the realm of Pluto.")
		},
		{
			"masculine": markForTranslation("His deeds will be judged by Minos, Radamanthus, and Aecus."),
			"feminine": markForTranslation("Her deeds will be judged by Minos, Radamanthus, and Aecus.")
		}
	]
};
