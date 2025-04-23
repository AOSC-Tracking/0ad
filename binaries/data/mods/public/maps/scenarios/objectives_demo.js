// IMPORTANT NOTE AHEAD: It is NOT recommended to add as many objectives in scenarios and as frequently as here (it is only done to demonstrate all cases).
// They are supposed feel significant to the player. (For example, "Storm the fortress!", "Repel the attack!", "Capture the city!")


// Objectives don't have to be added in a fixed order. Their ID's are of mere symbolic value.
const OBJECTIVE_ID_PATIENCE = 0;
const OBJECTIVE_ID_COMPLETION_DEMO = 2;
const OBJECTIVE_ID_TREE_CHOPPING = 1;
const OBJECTIVE_ID_DEFENDING = 4;

Trigger.prototype.InitDemo = function()
{
    this.RegisterTrigger("OnPlayerDefeated", "DisableAllTriggers", { "enabled": true });

    // Necessary for the attack commands to work. Units can only attack entites in revealed areas of the map.
    Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager).SetLosRevealAll(this.enemyID, true);

    QueryPlayerIDInterface(this.playerID).AddObjective(OBJECTIVE_ID_PATIENCE, {
        "title": markForTranslation("PATIENCE"),
        "isMainObjective": true,
        "isInitialObjective": true,
        }, { "task": markForTranslation("Prove yourself worthy by waiting 10 seconds."), },
        { "onlyResolveWhenClosing": true, "closeButtonCaption": "Start the timer" },
        { "method": "StartPatienceTimer" }
    );
};

Trigger.prototype.DisableAllTriggers = function()
{
    for (const event of this.eventNames)
        for (const methodName in this.triggers[event])
            this.DisableTrigger(event, methodName);
};

Trigger.prototype.StartPatienceTimer = function()
{
    this.patienceObjectiveTimer = this.DoAfterDelay(10000, "CompletePatienceObjective", {});
};

Trigger.prototype.CompletePatienceObjective = function()
{
    Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer).CancelTimer(this.patienceObjectiveTimer);
    QueryPlayerIDInterface(this.playerID).CompleteObjective(OBJECTIVE_ID_PATIENCE, {
        "info": markForTranslation("Congratulations, the time has passed; your patience has paid off.")
    });
    // Multiple objectives can be added (or completed, etc.) at once. The GUI is responsible for showing the changes to the player one after the other.
    this.AddAlreadyCompletedObjective();
    this.AddTreeChoppingObjective();
};

/**
 * This method shows how to deal with objectives that are already completed (or failed) at the point they're supposed to be added in the first place.
 * Most importantly, these objectives should not be skipped. A future objective overview panel in the GUI should still be able to show them.
 * Instead, they simply need to be added and then completed right away.
 * It is good practice to always check for completion/failure directly after adding a new objective.
 */
Trigger.prototype.AddAlreadyCompletedObjective = function()
{
    QueryPlayerIDInterface(this.playerID).AddObjective(OBJECTIVE_ID_COMPLETION_DEMO, {
        "title": markForTranslation("START THE GAME"),
        "isMainObjective": true,
        "isInitialObjective": false,
        }, { "task": "This will never be shown." }
    );
    QueryPlayerIDInterface(this.playerID).CompleteObjective(OBJECTIVE_ID_COMPLETION_DEMO,
        { "info": markForTranslation("This is an objective you (obviously) have completed before it was even added.") }
    );
};


Trigger.prototype.AddTreeChoppingObjective = function()
{
    // TODO: Ideally, the 'resourceIcon' function (in the GUI) should be used for these somehow.
    const woodIcon = "[icon=\"icon_wood\" displace=\"0 2\"]";
    const metalIcon = "[icon=\"icon_metal\" displace=\"0 2\"]";

    const resourceAmounts = {
        "requiredWood": 100,
        "rewardedMetal": 500
    };

    QueryPlayerIDInterface(this.playerID).AddObjective(OBJECTIVE_ID_TREE_CHOPPING, {
            "title": markForTranslation("TREE CHOPPING"),
            "isMainObjective": false,
        }, {
            "info": markForTranslation("There are so many trees close by -- too many to not chop some down, right?"),
            "task": sprintf(markForTranslation("Gather %(woodIcon)s %(amount)s"), {
                "woodIcon": woodIcon,
                "amount": resourceAmounts.requiredWood
            }),
            "reward": sprintf(markForTranslation("%(metalIcon)s %(amount)s"), {
                "metalIcon": metalIcon,
                "amount": resourceAmounts.rewardedMetal
            })
    }, {},
    // Notice how the resource amounts are passed to the callback here.
    // Obviously, it isn't strictly necessary here, but there are cases in which it is.
    { "method": "InitTreeChoppingObjective", "args": resourceAmounts });
};

Trigger.prototype.InitTreeChoppingObjective = async function(resourceAmounts)
{
    this.treeChoppingTimer = this.DoRepeatedly(500, "CheckForCompletionOfTreeChopping", resourceAmounts);
    this.cancelDialogTimer = this.DoAfterDelay(4000, "OfferToCancelTreeChopping", {});
    this.CheckForCompletionOfTreeChopping(resourceAmounts);
};

Trigger.prototype.CheckForCompletionOfTreeChopping = function(resourceAmounts)
{
    const cmpPlayer = QueryPlayerIDInterface(this.playerID);
    if (cmpPlayer.GetResourceCounts().wood >= resourceAmounts.requiredWood)
    {
        cmpPlayer.CompleteObjective(OBJECTIVE_ID_TREE_CHOPPING, {
            "info": markForTranslation("You have very diligently been collecting wood!")
        });
        cmpPlayer.AddResource("metal", resourceAmounts.rewardedMetal);
        Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer).CancelTimer(this.treeChoppingTimer);
    }
};

Trigger.prototype.OfferToCancelTreeChopping = function()
{
	Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface).PushNotification({
		"type": "dialog",
		"players": [this.playerID],
		"dialogName": "yes-no",
		"data": {
			"text": {
				"caption": {
					"message": markForTranslation("Do you want to cancel the side objective 'TREE CHOPPING'?"),
					"translateMessage": true,
				},
			},
			"button1": {
				"caption": {
					"message": markForTranslation("Yes"),
					"translateMessage": true,
				},
				"tooltip": {
					"message": markForTranslation("Cancel the objective."),
					"translateMessage": true,
				},
			},
			"button2": {
				"caption": {
					"message": markForTranslation("No"),
					"translateMessage": true,
				},
				"tooltip": {
					"message": markForTranslation("Don't cancel the objective."),
					"translateMessage": true,
				}
			}
		}
	});

    this.RegisterTrigger("OnPlayerCommand", "HandlePotentialDialogResponse", { "enabled": true });
};

Trigger.prototype.HandlePotentialDialogResponse = function(data)
{
    if (data.player != this.playerID || !data.cmd || data.cmd.type != "dialog-answer" || data.cmd.dialog != "yes-no")
        return;

    if (data.cmd.answer == "button1")
        QueryPlayerIDInterface(this.playerID).CancelObjective(OBJECTIVE_ID_TREE_CHOPPING, {
            "info": markForTranslation("You have cancelled this objective. How lazy!")
        });

    Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer).CancelTimer(this.treeChoppingTimer);
    this.DisableTrigger("OnPlayerCommand", "HandlePotentialDialogResponse");
    this.DoAfterDelay(data.cmd.answer == "button1" ? 4000 : 1000, "AddDefenseObjective", {});
};

Trigger.prototype.AddDefenseObjective = function()
{
    warn("Sending the command to add the 'defense' objective...")
    QueryPlayerIDInterface(this.playerID).AddObjective(OBJECTIVE_ID_DEFENDING, {
        "title": "DEFENSE",
        "isMainObjective": true
        }, {
            "info": markForTranslation("A group of soldiers is approaching your base. And they certainly don't look friendly..."),
            "task": markForTranslation("Defend your Civic Center, kill the enemy soldiers and destroy their ram."),
            "reward": markForTranslation("Victory"),
            "consequence": markForTranslation("Defeat")
        },
        // This flag is used to prevent players from buying themselves time by just not closing previous notifications (and thus stalling the game, e.g. until they've phased up).
        // It makes the GUI close all notification before it (there could always be some just by coincidence) automatically after a certain amount of time.
        { "isUrgent": true },
        { "method": "InitDefenseObjective" }
    );
};

Trigger.prototype.InitDefenseObjective = async function()
{
    warn("Continuing in the trigger script and actually carrying out the attack...");

    this.enemySoldiers = new Set();
    this.enemyRams = new Set();
    for (const ent of TriggerHelper.GetEntitiesByPlayer(this.enemyID))
    {
        const cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
        if (cmpIdentity.HasClass("Soldier"))
            this.enemySoldiers.add(ent);
        else if (cmpIdentity.HasClass("Ram"))
            this.enemyRams.add(ent);
    }

    this.civicCenterEnt = TriggerHelper.GetEntitiesByPlayer(this.playerID).find(ent => Engine.QueryInterface(ent, IID_Identity)?.HasClass("CivilCentre"));
    if (!this.civicCenterEnt)
        this.CompleteDefenseObjective();
    const targetPosition = Engine.QueryInterface(this.civicCenterEnt, IID_Position).GetPosition2D();

    if (this.enemySoldiers.size)
        ProcessCommand(this.enemyID, {
            "type": "attack-walk",
            "entities": Array.from(this.enemySoldiers),
            "x": targetPosition.x,
            "z": targetPosition.y,
            "targetClasses": { "attack": ["Unit"] },
            "allowCapture": false,
            "queued": false
        });

    if (this.enemyRams.size)
        ProcessCommand(this.enemyID, {
			"type": "attack",
			"entities": Array.from(this.enemyRams),
			"target": this.civicCenterEnt,
			"allowCapture": false,
            "formation": NULL_FORMATION
		});

    this.RegisterTrigger("OnOwnershipChanged", "DefenseObjectiveOnOwnershipChanged", { "enabled": true });
    this.RegisterTrigger("OnEntityRenamed", "DefenseObjectiveOnEntityRenamed", {"enabled": true });
    // Check whether the attackers have already been defeated.
    this.DefenseObjectiveOnOwnershipChanged({ "entity": -1, "from": -1, "to": -1 });
};

Trigger.prototype.DefenseObjectiveOnOwnershipChanged = function(data)
{
    if (data.entity == this.civicCenterEnt && data.to == -1)
        this.FailDefenseObjective();
    else if (this.enemySoldiers.has(data.entity) && data.to == -1)
        this.enemySoldiers.delete(data.entity);
    else if (this.enemyRams.has(data.entity) && data.to == -1)
        this.enemyRams.delete(data.entity);

    if (!this.enemyRams.size && !this.enemySoldiers.size)
        this.CompleteDefenseObjective();
};

Trigger.prototype.DefenseObjectiveOnEntityRenamed = function(data)
{
    if (this.civicCenterEnt == data.entity)
        this.civicCenterEnt = data.newentity;
    else if (this.enemySoldiers.has(data.entity))
    {
        this.enemySoldiers.delete(data.entity);
        this.enemySoldiers.add(data.newentity);
    }
    else if (this.enemyRams.has(data.entity))
    {
        this.enemySoldiers.delete(data.entity);
        this.enemySoldiers.add(data.newentity);
    }
};

Trigger.prototype.EndDefenseObjective = function()
{
    this.DisableTrigger("OnOwnershipChanged", "DefenseObjectiveOnOwnershipChanged");
    this.DisableTrigger("OnEntityRenamed", "DefenseObjectiveOnEntityRenamed");
};

Trigger.prototype.FailDefenseObjective = function()
{
    this.EndDefenseObjective();
    QueryPlayerIDInterface(this.playerID).FailObjective(OBJECTIVE_ID_DEFENDING, {
        "info": markForTranslation("Your Civic Center has been destroyed!")
    });
    TriggerHelper.SetPlayerWon(this.enemyID, () => markForTranslation("%(player)s has won."), () => markForTranslation("%(player)s has been defeated."));
};

Trigger.prototype.CompleteDefenseObjective = function()
{
    this.EndDefenseObjective();
    QueryPlayerIDInterface(this.playerID).CompleteObjective(OBJECTIVE_ID_DEFENDING, {
        "info": markForTranslation("You have successfully defeated the attackers!")
    });
    TriggerHelper.SetPlayerWon(this.playerID, () => markForTranslation("%(player)s has won."), () => "");
};

{
    let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
    cmpTrigger.playerID = 1;
    cmpTrigger.enemyID = 2;
    cmpTrigger.RegisterTrigger("OnInitGame", "InitDemo", { "enabled": true });
};