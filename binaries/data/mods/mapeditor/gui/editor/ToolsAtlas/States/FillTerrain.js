toolsAtlasStates.FillTerrain = class extends FSMv2State
{
	constructor(workingMemory, commandManager, changeStateFn, guiFn)
	{
		super("fillTerrain");
		this.workingMemory = workingMemory;
		this.commandManager = commandManager;
		this.changeStateFn = changeStateFn;
		this.guiFn = guiFn;
	}

	onHandleInputAfterGui(ev)
	{
		if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEMOTION)
		{
			this.workingMemory.position = { x: ev.x, y: ev.y };
			this.workingMemory.brush.UpdatePosition(ev.x, ev.y);
			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEBUTTONDOWN && ev.button === SDLConstans.SDL_MOUSE_BUTTONS.SDL_BUTTON_LEFT)
		{
			this.commandManager.pushCommand("FillTerrain", {
				"position": this.workingMemory.position,
				"brush": this.workingMemory.brush,
				"terrainName": this.workingMemory.terrainName,
			});
			return true;
		}
	}

	onEnter()
	{
		if (!this.workingMemory.brush)
			throw new Error("Brush not found");

		let size = 2;
		let data = [];

		for (let y = 0; y < size; ++y)
		{
			for (let x = 0; x < size; ++x)
			{
				data.push(1.0);
			}
		}

		this.workingMemory.brush.SetData(size, size, data);
		this.workingMemory.brush.SetRenderEnabled(true);

		this.guiFn("brushSettings", true);
		this.guiFn("paintSettings", true);
	}

	onLeave()
	{
		this.workingMemory.brush.SetRenderEnabled(false);

		this.guiFn("brushSettings", false);
		this.guiFn("paintSettings", false);
	}
};
