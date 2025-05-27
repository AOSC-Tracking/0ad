EditorWindow.prototype.ClassControls.CommandManager = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.cmdProc = new CommandProc();

		this.setupWindow.registerHandleInputAfterGuiHandler(this.onHandleInputAfterGui.bind(this));
	}

	pushCommand(commandName, args)
	{
		if (this.Commands[commandName] === undefined)
			throw new Error('Invalid command name');

		this.cmdProc.submit(new this.Commands[commandName](args));
		if (this.cmdProc.historyCommand.length > 0)
			return this.cmdProc.historyCommand[this.cmdProc.historyCommand.length - 1];
	}

	markCommandAsFinalized()
	{
		if (this.cmdProc.historyCommand.length > 0)
			this.cmdProc.historyCommand[this.cmdProc.historyCommand.length - 1].finalize = true;
	}

	onHandleInputAfterGui(ev)
	{
		if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_HOTKEYPRESS && ev.hotkey === SDLConstans.GUI_MAPPINGS_HOTKEYS.MAPEDITOR_UNDO)
		{
			this.cmdProc.undo();
			return true;
		}
		else if (ev.type === SDLConstans.GUI_MAPPINGS_EVENTS.SDL_HOTKEYPRESS && ev.hotkey === SDLConstans.GUI_MAPPINGS_HOTKEYS.MAPEDITOR_REDO)
		{
			this.cmdProc.redo();
			return true;
		}
	}
}

Object.defineProperty(EditorWindow.prototype.ClassControls.CommandManager.prototype, "Commands", {
	"value": {},
	"enumerable": false,
	"writable": true,
});

var commandManagerComands = EditorWindow.prototype.ClassControls.CommandManager.prototype.Commands;
