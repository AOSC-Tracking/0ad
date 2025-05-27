EditorWindow.prototype.ClassControls.BrushSettings = class extends ObservableSetting
{
	constructor(setupWindow)
	{
		super();
		this.tool = "";
		this.info = {
			size: 1,
			data: []
		};
		this.strength = 1;

	}
}
