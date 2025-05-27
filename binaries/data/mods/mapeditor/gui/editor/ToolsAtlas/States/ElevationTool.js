toolsAtlasStates.ElevationTool = class extends FSMv2State
{
	constructor(workingMemory, commandManager, changeStateFn)
	{
		super("elevationTool");
		this.workingMemory = workingMemory;
		this.commandManager = commandManager;
		this.changeStateFn = changeStateFn;
	}

	onTick(dt)
	{
		this.commandManager.pushCommand(this.workingMemory.commandName, {
			"position": this.workingMemory.position,
			"brush": this.workingMemory.brush,
			"priority": this.workingMemory.priorityBrush * this.workingMemory.strength * dt,
		});
	}

	onHandleInputAfterGui(ev)
	{
		if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEMOTION)
		{
			this.workingMemory.position = { x: ev.x, y: ev.y };
			this.workingMemory.brush.UpdatePosition(ev.x, ev.y);
			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEBUTTONUP)
		{
			this.changeStateFn(this.workingMemory.backToState);
			return true;
		}
	}

	onEnter()
	{
		if (!this.workingMemory.brush)
			throw new Error("Brush not found");

		if (!this.workingMemory.priorityBrush)
			throw new Error("Priority brush not found");

		if (!this.workingMemory.commandName)
			throw new Error("Command name not found");

		if (!this.workingMemory.strength)
			throw new Error("Strength not found");

		if (!this.workingMemory.backToState)
			throw new Error("Back state not found");

		this.workingMemory.brush.SetRenderEnabled(true);
	}

	onLeave()
	{
		this.commandManager.markCommandAsFinalized();
		this.workingMemory.brush.SetRenderEnabled(false);
	}
}
