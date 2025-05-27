toolsAtlasStates.Idle = class extends FSMv2State
{
	constructor(workingMemory)
	{
		super("idle");
		this.workingMemory = workingMemory;
	}
}
