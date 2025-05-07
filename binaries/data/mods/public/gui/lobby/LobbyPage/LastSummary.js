function LastGameSummary()
{
	const replays = Engine.GetReplays(false);
	if (!replays.length)
	{
		messageBox(500, 200, translate("No replays data available."), translate("Error"));
		return;
	}

	const lastReplay = replays.reduce((a, b) => a.attribs.timestamp > b.attribs.timestamp ? a : b);
	if (!lastReplay)
	{
		messageBox(500, 200, translate("No last replay data available."), translate("Error"));
		return;
	}

	const simData = Engine.GetReplayMetadata(lastReplay.directory);
	if (!simData)
	{
		messageBox(500, 200, translate("No summary data available."), translate("Error"));
		return;
	}

	Engine.OpenChildPage("page_summary.xml", {
		"sim": simData,
		"gui": {
			"replayDirectory": lastReplay.directory,
			"isInLobby": true,
			"ingame": false,
			"dialog": true
		}
	});
}