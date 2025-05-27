// this state is a stackgolder for working memoery used in PaintTerrain and ElevationTerrain
toolsAtlasStates.BrushSettings = class extends FSMv2State
{
	constructor(workingMemory, commandManager, changeStateFn, guiFn, watcherFn)
	{
		super("brushSettings");
		this.workingMemory = workingMemory;

		watcherFn("brushSettings", ["info", "strength"], (info, strength) => {
			this.workingMemory.brushSize = info.size;
			this.workingMemory.brushData = info.data;
			this.workingMemory.strength = this.STRENGTH_MULTIPLIER * (strength / this.STRENGTH_DIVIDER);
		});
	}
}

toolsAtlasStates.BrushSettings.prototype.STRENGTH_MULTIPLIER = 1024.0;
toolsAtlasStates.BrushSettings.prototype.STRENGTH_DIVIDER = 10.0;
