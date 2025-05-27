
var loadingWindow;

function init(initData, hotloadData)
{
	if (!loadingWindow)
		loadingWindow = new LoadingWindow(initData, hotloadData);

	Engine.SetCursor("cursor-wait");
}

/**
 * This is a reserved function name that is executed by the engine when it is ready
 * to start the game (i.e. loading progress has reached 100%).
 */
function reallyStartGame()
{
	Engine.SwitchGuiPage("page_editor.xml");
	Engine.ResetCursor();
}
