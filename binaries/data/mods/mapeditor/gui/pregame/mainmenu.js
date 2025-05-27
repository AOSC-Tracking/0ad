
var menuWindow;

function init(initData, hotloadData)
{
	if (!menuWindow)
		menuWindow = new MainMenuWindow(initData, hotloadData);
}

function getHotloadData()
{
	return menuWindow.getHotloadData();
}

function handleInputBeforeGui(ev, hoveredObject)
{
	return menuWindow.onHandleInputBeforeGui(ev, hoveredObject);
}

function handleInputAfterGui(ev)
{
	return menuWindow.onHandleInputAfterGui(ev);
}

