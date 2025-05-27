EditorWindow.prototype.ClassControls.ToolsAtlasController = class
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.workingMemory = {
			selection: [],
			terrainName: "",
			position: {x: 0, y: 0},
		};

		this.states = Object.keys(this.States).sort(
			(a, b) => (this.States[a].ORDER || -1) - (this.States[b].ORDER || -1)
		);

		this.commandMannager = this.setupWindow.controls.commandManager;

		this.setupWindow.registerLoadHandler(() => {
			this.guiController = this.setupWindow.controls.guiController;
			this.workingMemory.terrainName = this.guiController.currentTerrainTexture;
			this.guiController.watch(()=> {
				this.workingMemory.terrainName = this.guiController.currentTerrainTexture;
			}, ["currentTerrainTexture"]);

			let changeStateFn = (nextState) => this.changeState(nextState);
			let guiFn = (gui, visible) => {
				let guiIsOpen = `${gui}IsOpen`;
					if (this.guiController[guiIsOpen] !== undefined)
						this.guiController[guiIsOpen] = !!visible;
					else
						warn(`${gui}IsOpen is not defined in guiController`);
			};
			let watcherFn = (ctrl, settings, fnWatch) => {
				let handlerCtrl = this.setupWindow.controls[ctrl];
				if (handlerCtrl === undefined)
				{
					warn(`${settings} is not defined in ${ctrl}`);
					return;
				}

				if (!Array.isArray(settings))
					settings = [settings];

				let fnAccesor = () => settings.reduce((acc, s) => {
					acc.push(handlerCtrl[s]);
					return acc;
				}, []);

				handlerCtrl.watch(()=> {
					fnWatch(...fnAccesor());
				}, settings);

				fnWatch(...fnAccesor());
			};
			let setterFn = (ctrl, setting, value) => {
				let handlerCtrl = this.setupWindow.controls[ctrl];
				if (handlerCtrl === undefined)
				{
					warn(`${ctrl} is not defined`);
					return;
				}

				if (handlerCtrl[setting] === undefined)
				{
					warn(`${setting} is not defined in ${ctrl}`);
					return;
				}

				handlerCtrl[setting] = value;
			};


			let instanceStates =  this.states.map(state => {
				return new this.States[state](this.workingMemory, this.commandMannager, changeStateFn, guiFn, watcherFn, setterFn);
			});

			let defaultState = instanceStates.find(state => state.name === this.DefaultStateName);
			if (!defaultState)
				throw new Error(`${this.DefaultStateName} state not found`);

			this.fsm = new FSMv2(defaultState, this.Transitions);

			for (let state of instanceStates.filter(state => state.name !== this.DefaultStateName))
				this.fsm.addState(state);
		});

		this.setupWindow.registerClosePageHandler(() => {
			this.changeState(this.DefaultStateName);
		});

		this.setupWindow.registerGetHotloadDataHandler((data) => {
			this.changeState(this.DefaultStateName);
		});

		this.setupWindow.registerHandleTickHandler((dt) => {
			if (this.fsm.currentState.onTick)
				this.fsm.currentState.onTick(dt);
		});

		this.setupWindow.registerHandleInputAfterGuiHandler(this.onHandleInputAfterGui.bind(this));
		this.setupWindow.registerHandleInputBeforeGuiHandler(this.onHandleInputBeforeGui.bind(this));
	}

	onHandleInputAfterGui(ev)
	{
		if (this.fsm.currentState.onHandleInputAfterGui)
			return this.fsm.currentState.onHandleInputAfterGui(ev);
	}

	onHandleInputBeforeGui(ev, hoveredObject)
	{
		if (this.fsm.currentState.onHandleInputBeforeGui)
			return this.fsm.currentState.onHandleInputBeforeGui(ev, hoveredObject);
	}

	changeState(newState)
	{
		if (this.fsm.currentState.name === newState)
			return;

		this.fsm.transitionTo(newState);
		this.guiController.currentState = newState;
	}
}

EditorWindow.prototype.ClassControls.ToolsAtlasController.ORDER = 100; // last one

Object.defineProperty(EditorWindow.prototype.ClassControls.ToolsAtlasController.prototype, "States", {
	"value": {},
	"enumerable": false,
	"writable": true,
});

EditorWindow.prototype.ClassControls.ToolsAtlasController.prototype.DefaultStateName = "idle";

EditorWindow.prototype.ClassControls.ToolsAtlasController.prototype.Transitions = {};

var toolsAtlasStates = EditorWindow.prototype.ClassControls.ToolsAtlasController.prototype.States;
var toolsAtlasTransitions = EditorWindow.prototype.ClassControls.ToolsAtlasController.prototype.Transitions;
