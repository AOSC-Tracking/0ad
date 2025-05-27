toolsAtlasStates.PaintTerraint = class extends FSMv2State {
	constructor(workingMemory, commandManager, changeStateFn, guiFn, watcherFn) {
		super("paintTerrain");
		this.workingMemory = workingMemory;
		this.commandManager = commandManager;
		this.changeStateFn = changeStateFn;
		this.guiFn = guiFn;
		this.enabled = false;

		watcherFn("brushSettings", ["info"], (info) => {
			if (this.enabled && this.workingMemory.brush)
				this.workingMemory.brush.SetData(info.size, info.size, info.data);
		});
	}

	onHandleInputAfterGui(ev) {
		if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEMOTION) {
			this.workingMemory.position = { x: ev.x, y: ev.y };
			this.workingMemory.brush.UpdatePosition(ev.x, ev.y);
			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_HOTKEYPRESS && ev.hotkey && ev.hotkey.startsWith("camera")) {
			this.workingMemory.brush.UpdatePosition(this.workingMemory.position.x, this.workingMemory.position.y);
			return false;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEBUTTONDOWN && ev.button === SDLConstans.SDL_MOUSE_BUTTONS.SDL_BUTTON_LEFT) {
			this.workingMemory.priorityBrush = 1;
			this.changeStateFn("paintTerrainWithPriority");
			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_MOUSEBUTTONDOWN && ev.button === SDLConstans.SDL_MOUSE_BUTTONS.SDL_BUTTON_RIGHT) {
			this.workingMemory.priorityBrush = -1;
			this.changeStateFn("paintTerrainWithPriority");
			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_HOTKEYPRESS && ev.hotkey === SDLConstans.GUI_MAPPINGS_HOTKEYS.MAPEDITOR_PAINT_EYEDROPPER) {
			this.changeStateFn("paintTerrainEyeDropper");
			return true;
		}
	}

	onEnter() {
		if (!this.workingMemory.brush)
			this.workingMemory.brush = MapEditor.CreateBrush();

		this.workingMemory.brush.SetData(this.workingMemory.brushSize, this.workingMemory.brushSize, this.workingMemory.brushData);
		this.workingMemory.brush.SetRenderEnabled(true);

		this.guiFn("brushSettings", true);
		this.guiFn("paintSettings", true);
		this.enabled = true;
	}

	onLeave(nextState) {
		this.workingMemory.brush.SetRenderEnabled(false);
		if (!nextState.startsWith("paint")) {
			this.guiFn("brushSettings", false);
			this.guiFn("paintSettings", false);
		}
		this.enabled = false;
	}
}
