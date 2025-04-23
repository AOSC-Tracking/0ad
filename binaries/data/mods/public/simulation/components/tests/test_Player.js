Resources = {
	"GetCodes": () => ["food", "metal", "stone", "wood"],
	"GetTradableCodes": () => ["food", "metal", "stone", "wood"],
	"GetBarterableCodes": () => ["food", "metal", "stone", "wood"],
	"GetResource": () => ({}),
	"BuildSchema": (type) => {
		let schema = "";
		for (const res of Resources.GetCodes())
			schema +=
				"<optional>" +
					"<element name='" + res + "'>" +
						"<ref name='" + type + "'/>" +
					"</element>" +
				"</optional>";
		return "<interleave>" + schema + "</interleave>";
	}
};

Engine.LoadHelperScript("ValueModification.js");
Engine.LoadComponentScript("interfaces/Player.js");
Engine.LoadComponentScript("interfaces/Cost.js");
Engine.LoadComponentScript("interfaces/Foundation.js");
Engine.LoadComponentScript("interfaces/ModifiersManager.js");
Engine.LoadComponentScript("interfaces/Trigger.js");
Engine.LoadComponentScript("Player.js");

var cmpPlayer = ConstructComponent(10, "Player", {
	"SpyCostMultiplier": 1,
	"BarterMultiplier": {
		"Buy": {
			"wood": 1.0,
			"stone": 1.0,
			"metal": 1.0
		},
		"Sell": {
			"wood": 1.0,
			"stone": 1.0,
			"metal": 1.0
		}
	},
	"Formations": { "_string": "" },
});

var playerID = 1;
cmpPlayer.SetPlayerID(playerID);
TS_ASSERT_EQUALS(cmpPlayer.GetPlayerID(), playerID);

TS_ASSERT_EQUALS(cmpPlayer.GetPopulationCount(), 0);
TS_ASSERT_EQUALS(cmpPlayer.GetPopulationLimit(), 0);

TS_ASSERT_EQUALS(cmpPlayer.GetSpyCostMultiplier(), 1);
TS_ASSERT_UNEVAL_EQUALS(cmpPlayer.GetBarterMultiplier(), {
	"buy": {
		"wood": 1.0,
		"stone": 1.0,
		"metal": 1.0
	},
	"sell": {
		"wood": 1.0,
		"stone": 1.0,
		"metal": 1.0
	}
});

AddMock(60, IID_Identity, {
	"GetClassesList": () => {},
	"HasClass": (cl) => true
});
AddMock(60, IID_Ownership);
AddMock(60, IID_Foundation, {});
cmpPlayer.OnGlobalOwnershipChanged({ "entity": 60, "from": INVALID_PLAYER, "to": playerID });
TS_ASSERT(!cmpPlayer.CanBarter());

AddMock(61, IID_Identity, {
	"GetClassesList": () => {},
	"HasClass": (cl) => false
});
cmpPlayer.OnGlobalOwnershipChanged({ "entity": 61, "from": INVALID_PLAYER, "to": playerID });
TS_ASSERT(!cmpPlayer.CanBarter());

AddMock(62, IID_Identity, {
	"GetClassesList": () => {},
	"HasClass": (cl) => true
});
cmpPlayer.OnGlobalOwnershipChanged({ "entity": 62, "from": INVALID_PLAYER, "to": playerID });
TS_ASSERT(cmpPlayer.CanBarter());

cmpPlayer.OnGlobalOwnershipChanged({ "entity": 62, "from": playerID, "to": INVALID_PLAYER });
TS_ASSERT(!cmpPlayer.CanBarter());


const OBJECTIVE_STATE_ACTIVE = 0;
const OBJECTIVE_STATE_COMPLETED = 1;
let notification = {};

const callbackArgs = { "test": 1 };
let callbackExecuted = 0;

AddMock(SYSTEM_ENTITY, IID_GuiInterface, {
	"PushNotification": (n) => { notification = n; }
});
AddMock(SYSTEM_ENTITY, IID_Trigger, {
	"callback": (args) => {
		TS_ASSERT_UNEVAL_EQUALS(args, callbackArgs);
		callbackExecuted++;
	}
});

cmpPlayer.AddObjective(0, {
	"title": "super catchy title",
	"isMainObjective": true,
	"isInitialObjective": true,
	}, { "task": "super interesting task", "reward": "super helpful reward" },
	{ "onlyResolveWhenClosing": false, "closeButtonCaption": "super cool close button caption" },
	{ "method": "callback", "args": callbackArgs }
);
TS_ASSERT_UNEVAL_EQUALS(cmpPlayer.objectives, [
	{
		"isMainObjective": true,
		"isInitialObjective": true,
		"title": "super catchy title",
		"state": OBJECTIVE_STATE_ACTIVE,
		"isDirty": true,
		"lastNotification": {
			"index": 0,
			"data": { "onlyResolveWhenClosing": false, "closeButtonCaption": "super cool close button caption" },
			"callbackData": { "method": "callback", "args": callbackArgs },
			"message": { "task": "super interesting task", "reward": "super helpful reward" }
		}
	}
]);
TS_ASSERT_UNEVAL_EQUALS(notification, {
	"type": "objective",
	"players": [playerID],
	"objectiveID": 0,
	"state": OBJECTIVE_STATE_ACTIVE,
	"title": "super catchy title",
	"isMainObjective": true,
	"isNewObjective": false,
	"message": { "task": "super interesting task", "reward": "super helpful reward" },
	"onlyResolveWhenClosing": false,
	"closeButtonCaption": "super cool close button caption"
});
TS_ASSERT_EQUALS(callbackExecuted, 0);


cmpPlayer.AddObjective(1, { "title": "another super catchy title" },
	{ "task": "another super interesting task", "reward": "another super helpful reward", "consequence": "awful consequence" },
	{ "onlyResolveWhenClosing": true }
);
TS_ASSERT_EQUALS(cmpPlayer.objectives.length, 2);
TS_ASSERT_UNEVAL_EQUALS(cmpPlayer.objectives[1], {
	"isMainObjective": false,
	"isInitialObjective": false,
	"title": "another super catchy title",
	"state": OBJECTIVE_STATE_ACTIVE,
	"isDirty": true,
	"lastNotification": {
		"index": 1,
		"data": { "onlyResolveWhenClosing": true },
		"callbackData": {},
		"message": { "task": "another super interesting task", "reward": "another super helpful reward", "consequence": "awful consequence" }
	}
});
TS_ASSERT_UNEVAL_EQUALS(notification, {
	"type": "objective",
	"players": [playerID],
	"objectiveID": 1,
	"state": OBJECTIVE_STATE_ACTIVE,
	"title": "another super catchy title",
	"isMainObjective": false,
	"isNewObjective": true,
	"message": { "task": "another super interesting task", "reward": "another super helpful reward", "consequence": "awful consequence" },
	"onlyResolveWhenClosing": true
});

cmpPlayer.MarkObjectiveClean(0);
cmpPlayer.MarkObjectiveClean(1);
TS_ASSERT(!cmpPlayer.objectives[1].isDirty);

cmpPlayer.CompleteObjective(1, { "info": "You did the impossible!" });
TS_ASSERT_UNEVAL_EQUALS(cmpPlayer.objectives, [
	{
		"isMainObjective": true,
		"isInitialObjective": true,
		"title": "super catchy title",
		"state": OBJECTIVE_STATE_ACTIVE,
		"isDirty": false,
		"lastNotification": {
			"index": 0,
			"data": { "onlyResolveWhenClosing": false, "closeButtonCaption": "super cool close button caption" },
			"callbackData": { "method": "callback", "args": callbackArgs },
			"message": { "task": "super interesting task", "reward": "super helpful reward" }
		}
	},
	{
		"isMainObjective": false,
		"isInitialObjective": false,
		"title": "another super catchy title",
		"state": OBJECTIVE_STATE_COMPLETED,
		"isDirty": true,
		"lastNotification": {
			"index": 2,
			"data": {},
			"callbackData": {},
			"message": { "task": "another super interesting task", "reward": "another super helpful reward", "consequence": "awful consequence", "info": "You did the impossible!" }
		}
	}
]);
TS_ASSERT_UNEVAL_EQUALS(notification, {
	"type": "objective",
	"players": [playerID],
	"objectiveID": 1,
	"state": OBJECTIVE_STATE_COMPLETED,
	"title": "another super catchy title",
	"isMainObjective": false,
	"isNewObjective": false,
	"message": { "task": "another super interesting task", "reward": "another super helpful reward", "consequence": "awful consequence", "info": "You did the impossible!" }
});
TS_ASSERT_EQUALS(callbackExecuted, 1);
