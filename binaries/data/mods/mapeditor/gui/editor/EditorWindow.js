class EditorWindow extends BaseSetupWindow
{
	closePage()
	{
		super.closePage();

		// TODO: Validate if we can close the ditor (saveMap and different things)
		MapEditor.EndMapEditor();
	}
}
