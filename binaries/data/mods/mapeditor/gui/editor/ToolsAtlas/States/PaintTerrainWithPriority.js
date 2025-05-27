toolsAtlasStates.PaintTerrainWithPriority = class extends FSMv2State
{
	constructor(workingMemory, commandManager, changeStateFn)
	{
		super("paintTerrainWithPriority");
		this.workingMemory = workingMemory;
		this.commandManager = commandManager;
		this.changeStateFn = changeStateFn;
	}

	onHandleInputAfterGui(ev)
	{
		if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEMOTION)
		{
			this.workingMemory.position = { x: ev.x, y: ev.y };
			this.workingMemory.brush.UpdatePosition(ev.x, ev.y);

			this.commandManager.pushCommand("PaintTerrain", {
				"position": this.workingMemory.position,
				"brush": this.workingMemory.brush,
				"priority": this.workingMemory.priorityBrush,
				"terrainName": this.workingMemory.terrainName,
			});

			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEBUTTONUP)
		{
			this.changeStateFn("paintTerrain");
			return true;
		}
	}

	onEnter()
	{
		if (!this.workingMemory.brush)
			throw new Error("Brush not found");

		if (!this.workingMemory.priorityBrush)
			throw new Error("Priority brush not found");

		this.workingMemory.brush.SetRenderEnabled(true);

		// send the command directly
		this.commandManager.pushCommand("PaintTerrain", {
			"position": this.workingMemory.position,
			"brush": this.workingMemory.brush,
			"priority": this.workingMemory.priorityBrush,
			"terrainName": this.workingMemory.terrainName,
		});
	}

	onLeave()
	{
		this.commandManager.markCommandAsFinalized();
		this.workingMemory.brush.SetRenderEnabled(false);
	}
}
