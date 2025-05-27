EditorWindow.prototype.ClassSetupWindowPages.BrushSettings = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.brushSettingsGui = Engine.GetGUIObjectByName("brushSettings");
		this.brushTool = Engine.GetGUIObjectByName("brushTool");
		this.brushShape = Engine.GetGUIObjectByName("brushShape");

		this.brushSize = Engine.GetGUIObjectByName("brushSize");
		this.brushSize.min_value = 0.01;
		this.brushSize.max_value = 1;

		this.brushStrength = Engine.GetGUIObjectByName("brushStrength");
		this.brushStrength.min_value = 0.01;
		this.brushStrength.max_value = 1;

		this.selfUpdating = false;

		this.setupWindow.registerLoadHandler(()=> {
			this.guiController = this.setupWindow.controls.guiController;
			this.brushSettings = this.setupWindow.controls.brushSettings;
			this.toolsAtlasController = this.setupWindow.controls.toolsAtlasController;

			this.guiController.watch(()=> {
				this.brushSettingsGui.hidden = !this.guiController.brushSettingsIsOpen;
			}, ["brushSettingsIsOpen"]);

			this.brushSettings.watch(()=> {
				this.brushSize.tooltip = `${this.brushSettings.info.size}`;
			}, ["info"]);

			this.brushSettings.watch(()=> {
				this.brushTool.selected = this.brushTool.list_data.indexOf(this.brushSettings.tool);
			}, ["tool"]);

			this.brushSettings.watch(()=> {
				if (!this.selfUpdating)
					this.brushStrength.value = this.brushSettings.strength / 100.0;

				this.brushStrength.tooltip = `${this.brushSettings.strength}`;
			}, ["strength"]);

			this.brushSize.onValueChange = () => {
				this.selfUpdating = true;
				let newSize = parseInt(this.brushSize.value * 100);
				this.brushSettings.info = {
					size: newSize,
					data: this.Shapes[this.brushShape.list_data[this.brushShape.selected]].onChange(newSize)
				};
				this.selfUpdating = false;
			}

			this.brushStrength.onValueChange = () => {
				this.selfUpdating = true;
				this.brushSettings.strength = parseInt(this.brushStrength.value * 100);
				this.selfUpdating = false;
				this.brushStrength.tooltip = `${this.brushSettings.strength}`;
			}
			this.init();
		});
	}

	init()
	{
		// tools will be sorting base on constant ORDER
		// if this Constant isnt define it set to -1
		let toolsOptions = Object.keys(this.Tools).sort(
			(a, b) => (this.Tools[a].order || -1) - (this.Tools[b].order || -1)
		);

		this.brushTool.list = toolsOptions.map((tool)=> this.Tools[tool].name);
		this.brushTool.list_data = toolsOptions;
		this.brushTool.onSelectionChange = () => {
			let selected = this.Tools[this.brushTool.list_data[this.brushTool.selected]];

			if (!selected)
				return;

			this.brushTool.tooltip = selected.tooltip;
			this.brushSettings.tool = this.brushTool.list_data[this.brushTool.selected];

			// we have a state to set
			if (selected.state)
				this.toolsAtlasController.changeState(selected.state);
		};
		this.brushTool.onHoverChange = () => {
			let selected = this.Tools[this.brushTool.list_data[this.brushTool.hovered]];

			if (!selected)
				return;

			this.brushTool.tooltip = selected.tooltip;
		};

		this.brushShape.list = Object.keys(this.Shapes).map((shape)=> this.Shapes[shape].name);
		this.brushShape.list_data = Object.keys(this.Shapes);
		this.brushShape.onSelectionChange = () => {
			let selected = this.Shapes[this.brushShape.list_data[this.brushShape.selected]];

			this.brushSettings.info= {
				size: this.brushSettings.info.size,
				data: selected.onChange(this.brushSettings.info.size)
			};

			this.brushShape.tooltip = selected.tooltip;
		}

		this.brushSettings.info = {
			size: 4,
			data: []
		};
		this.brushSettings.strength = 10;

		this.brushShape.selected = 0;
	}
}

Object.defineProperty(EditorWindow.prototype.ClassSetupWindowPages.BrushSettings.prototype, "Shapes", {
	"value": {},
	"enumerable": false,
	"writable": true,
});

Object.defineProperty(EditorWindow.prototype.ClassSetupWindowPages.BrushSettings.prototype, "Tools", {
	"value": {},
	"enumerable": false,
	"writable": true,
});

let BrushTools = EditorWindow.prototype.ClassSetupWindowPages.BrushSettings.prototype.Tools;
let BrushShapes = EditorWindow.prototype.ClassSetupWindowPages.BrushSettings.prototype.Shapes;
