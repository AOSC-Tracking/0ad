BaseSettings.prototype.Helpers.MapTypes.push({
	"Name": "random",
	"Title": translateWithContext("map", "Random"),
	"Description": translate("Create a unique map with a different resource distribution each time. Freely select the number of players and teams."),
	"Path": "maps/random/",
	"Suffix": ".json",
	"GetData": mapPath => Engine.ReadJSONFile(mapPath + ".json"),
	"CheckIfExists": mapPath => Engine.FileExists(mapPath + ".json")
});
