toolsAtlasStates.SelectorBandbox = class extends FSMv2State
{
	constructor(workingMemory, commandManager, changeStateFn, guiFn, watcherFn)
	{
		super("selectorBandbox");
		this.workingMemory = workingMemory;
		this.guiFn = guiFn;
		this.changeStateFn = changeStateFn;
		this.bandBoxGUI = Engine.GetGUIObjectByName("bandbox");
	}

	updateBandbox(x1, y1, x2, y2, hidden = false)
	{
		let scale = +Engine.ConfigDB_GetValue("user", "gui.scale");
		let xMin = Math.min(x1, x2);
		let yMin = Math.min(y1, y2);
		let xMax = Math.max(x1, x2);
		let yMax = Math.max(y1, y2);

		this.bandBoxGUI.size = new GUISize(xMin / scale, yMin / scale, xMax / scale, yMax / scale);
		this.workingMemory.rect = [xMin, yMin, xMax, yMax];
		this.bandBoxGUI.hidden = hidden;
	}

	onHandleInputAfterGui(ev)
	{
		if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEBUTTONUP)
		{
			let entities = MapEditor.PickEntitiesInRect(...this.workingMemory.rect, Engine.HotkeyIsPressed("mapeditor.selector.actors"));
			let selectionAdd = Engine.HotkeyIsPressed("selection.add");
			let selectionRemove = Engine.HotkeyIsPressed("selection.remove");
			this.workingMemory.deselectEntities = [];

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

			this.workingMemory.highlightList = this.workingMemory.highlightList.filter(e => !this.workingMemory.selection.includes(e));
			this.workingMemory.selectorLastSelection = 0;
			this.changeStateFn("selector");
			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEMOTION)
		{
			this.updateBandbox(this.workingMemory.position.x, this.workingMemory.position.y, ev.x, ev.y);
			return true;
		}
	}

	onEnter()
	{
		this.guiFn("objectSettings", true);
		this.updateBandbox(0, 0, 0, 0, true);
	}

	onLeave()
	{
		this.guiFn("objectSettings", false);
		this.updateBandbox(0, 0, 0, 0, true);
	}
}
