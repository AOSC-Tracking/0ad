
var editorWindow;

function init(initData, hotloadData)
{
	if (!editorWindow)
		editorWindow = new EditorSetupWindow(initData, hotloadData);
}

function getHotloadData()
{
	return editorWindow.getHotloadData();
}

function handleInputBeforeGui(ev, hoveredObject)
{
	return editorWindow.onHandleInputBeforeGui(ev, hoveredObject);
}

function handleInputAfterGui(ev)
{
	return editorWindow.onHandleInputAfterGui(ev);
}
