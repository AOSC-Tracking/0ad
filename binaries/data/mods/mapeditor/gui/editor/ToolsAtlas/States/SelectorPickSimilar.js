toolsAtlasStates.SelectorPickSimilar = class extends FSMv2State
{
	constructor(workingMemory, commandManager, changeStateFn, guiFn, watcherFn)
	{
		super("selectorPickSimilar");
		this.workingMemory = workingMemory;
		this.guiFn = guiFn;
		this.changeStateFn = changeStateFn;
	}

	onHandleInputAfterGui(ev)
	{
		if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEBUTTONUP)
		{
			let selectionAdd = Engine.HotkeyIsPressed("selection.add");
			let selectionRemove = Engine.HotkeyIsPressed("selection.remove");
			this.workingMemory.deselectEntities = [];

			let entities = MapEditor.PickSimilarEntities(this.workingMemory.selectorLastSelection, Engine.HotkeyIsPressed("mapeditor.selector.actors"));

			if (!selectionAdd && !selectionRemove)
			{
				this.workingMemory.deselectEntities = [...this.workingMemory.selection.filter(e => !entities.includes(e))];
				this.workingMemory.selection = entities;
			}
			else
			{
				for (let ent of entities)
				{
					let isSelected = this.workingMemory.selection.includes(ent);
					if (selectionRemove)
					{
						if (isSelected)
						{
							this.workingMemory.deselectEntities.push(ent);
							this.workingMemory.selection = this.workingMemory.selection.filter(e => e !== ent);
						}
					}
					else if(!isSelected)
					{
						this.workingMemory.selection.push(ent);
					}
				}
			}

			this.workingMemory.selectorLastSelection = 0;
			this.changeStateFn("selector");
			return true;
		}
	}

	onEnter()
	{
		this.guiFn("objectSettings", true);

		if (!this.workingMemory.selectorLastSelection)
			throw new Error("No object selected");

	}

	onLeave()
	{
		this.guiFn("objectSettings", false);
	}
}
