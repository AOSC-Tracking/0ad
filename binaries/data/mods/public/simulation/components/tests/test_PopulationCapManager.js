Engine.LoadHelperScript("Player.js");
Engine.LoadComponentScript("interfaces/PlayerManager.js");
Engine.LoadComponentScript("interfaces/Diplomacy.js");
Engine.LoadComponentScript("interfaces/PopulationCapmanager.js");
Engine.LoadComponentScript("PopulationCapManager.js");

const cmpPopulationCapManager = ConstructComponent(SYSTEM_ENTITY, "PopulationCapManager");
const playerData = [
	{
		"team": -1
	},
	{
		"team": -1
	},
	{
		"team": -1
	},
	{
		"team": 1
	},
	{
		"team": 1
	},
	{
		"team": 1
	}
];

let currentPopCaps = [];

AddMock(SYSTEM_ENTITY, IID_PlayerManager, {
	"GetNonGaiaPlayers": () => { return Object.keys(playerData).filter(id => id != 0); }
});

for (let playerID in Object.keys(playerData))
{
	AddMock(playerID, IID_Player, {
		"SetMaxPopulation": (val) => { currentPopCaps[playerID] = val; }
	});
	AddMock(playerID, IID_Diplomacy, {
		"GetTeam": (id) => { return playerData[id].team; }
	});
}

cmpPopulationCapManager.SetPopCap(300);
cmpPopulationCapManager.SetPopCapType("player");
TS_ASSERT_UNEVAL_EQUALS(currentPopCaps, [null, 300, 300, 300, 300, 300]);

cmpPopulationCapManager.SetPopCapType("team");
TS_ASSERT_UNEVAL_EQUALS(currentPopCaps, [null, 300, 300, 100, 100, 100]);

playerData.pop();
cmpPopulationCapManager.OnGlobalPlayerDefeated({ "playerId": 5 });
TS_ASSERT_UNEVAL_EQUALS(currentPopCaps, [null, 300, 300, 150, 150]);

cmpPopulationCapManager.SetPopCapType("world");
TS_ASSERT_UNEVAL_EQUALS(currentPopCaps, [null, 75, 75, 75, 75]);

playerData.pop();
cmpPopulationCapManager.OnGlobalPlayerDefeated({ "playerId": 4 });
TS_ASSERT_UNEVAL_EQUALS(currentPopCaps, [null, 100, 100, 100]);
