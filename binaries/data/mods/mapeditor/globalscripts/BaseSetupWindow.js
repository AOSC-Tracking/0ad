class BaseSetupWindow
{
	windowName = "setupWindow";
	constructor(initData, hotloadData)
	{
		Engine.ProfileStart(`BaseSetupWindow ${this.constructor.name}`);

		this.loadHandlers = new Set();
		this.closePageHandlers = new Set();
		this.getHotloadDataHandlers = new Set();
		this.handleInputBeforeGuiHandlers = new Set();
		this.handleInputAfterGuiHandlers = new Set();
		this.handleTickHandlers = new Set();

		if (initData?.backPage)
			this.backPage = initData.backPage;

		this.controls = {};

		// controls will be sorting base on constant ORDER
		// if this Constant isnt define it set to -1
		let classControls = Object.keys(this.ClassControls).sort(
			(a, b) => (this.ClassControls[a].ORDER || -1) - (this.ClassControls[b].ORDER || -1)
		);

		for (const classControl of classControls)
		{
			const name = classControl.charAt(0).toLowerCase() + classControl.slice(1);
			if (name in this.controls)
				error("control '" + name + "' is already used.");
			this.controls[name] = new this.ClassControls[classControl](this);
		}

		// These are the pages within the setup window that may use the controls defined above
		this.pages = {};

		let classSetupWindowPages = Object.keys(this.ClassSetupWindowPages).sort(
			(a, b) => (this.ClassSetupWindowPages[a].ORDER || -1) - (this.ClassSetupWindowPages[b].ORDER || -1)
		);
		for (const classSetupWindowPage of classSetupWindowPages)
		{
			const name = classSetupWindowPage.charAt(0).toUpperCase() + classSetupWindowPage.slice(1);
			if (name in this.pages)
				error("page '" + name + "' is already used.");
			this.pages[name] = new this.ClassSetupWindowPages[classSetupWindowPage](this);
		}

		this.window = Engine.GetGUIObjectByName(this.windowName);
		this.window.onTick = this.onHandleTick.bind(this);

		// This event is triggered after all classes have been instantiated and subscribed to each others events
		for (let handler of this.loadHandlers)
			handler(initData, hotloadData);

		Engine.ProfileStop();
	}

	registerLoadHandler(handler)
	{
		this.loadHandlers.add(handler);
	}

	unregisterLoadHandler(handler)
	{
		this.loadHandlers.delete(handler);
	}

	registerClosePageHandler(handler)
	{
		this.closePageHandlers.add(handler);
	}

	unregisterClosePageHandler(handler)
	{
		this.closePageHandlers.delete(handler);
	}

	registerGetHotloadDataHandler(handler)
	{
		this.getHotloadDataHandlers.add(handler);
	}

	unregisterGetHotloadDataHandler(handler)
	{
		this.getHotloadDataHandlers.delete(handler);
	}

	registerHandleInputBeforeGuiHandler(handler)
	{
		this.handleInputBeforeGuiHandlers.add(handler);
	}

	unregisterHandleInputBeforeGuiHandler(handler)
	{
		this.handleInputBeforeGuiHandlers.delete(handler);
	}

	registerHandleInputAfterGuiHandler(handler)
	{
		this.handleInputAfterGuiHandlers.add(handler);
	}

	unregisterHandleInputAfterGuiHandler(handler)
	{
		this.handleInputAfterGuiHandlers.delete(handler);
	}

	registerHandleTickHandler(handler)
	{
		this.handleTickHandlers.add(handler);
	}

	unregisterHandleTickHandler(handler)
	{
		this.handleTickHandlers.delete(handler);
	}

	getHotloadData()
	{
		let object = {};
		for (let handler of this.getHotloadDataHandlers)
			handler(object);
		return object;
	}

	closePage()
	{
		for (let handler of this.closePageHandlers)
			handler();

		if (this.backPage)
			Engine.SwitchGuiPage(this.backPage.page, this.backPage?.data);

		Engine.SwitchGuiPage("page_pregame.xml");
	}

	onHandleInputBeforeGui(ev, hoveredObject)
	{
		for (let handler of this.handleInputBeforeGuiHandlers)
			if (handler(ev, hoveredObject) === true)
				return true;

		return false;
	}

	onHandleInputAfterGui(ev)
	{
		for (let handler of this.handleInputAfterGuiHandlers)
			if (handler(ev) === true)
				return true;

		return false;
	}

	onHandleTick(dt)
	{
		for (let handler of this.handleTickHandlers)
			handler(dt);
	}
}

Object.defineProperty(BaseSetupWindow.prototype, "ClassControls", {
	"value": {},
	"enumerable": false,
	"writable": true,
});

Object.defineProperty(BaseSetupWindow.prototype, "ClassSetupWindowPages", {
	"value": {},
	"enumerable": false,
	"writable": true,
});
