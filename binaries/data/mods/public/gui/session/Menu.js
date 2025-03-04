/**
 * This class constructs and positions the menu buttons and assigns the handlers defined in MenuButtons.
 */
class Menu
{
	constructor(pauseControl, playerViewControl, chat)
	{
		this.menuButton = Engine.GetGUIObjectByName("menuButton");
		this.menuButton.onPress = this.toggle.bind(this);
		registerHotkeyChangeHandler(this.rebuild.bind(this));

		this.isOpen = false;

		this.menuButtonPanel = Engine.GetGUIObjectByName("menuButtonPanel");
		let menuButtons = this.menuButtonPanel.children;
		this.margin = menuButtons[0].size.top;
		this.buttonHeight = menuButtons[0].size.bottom;

		let handlerNames = this.getHandlerNames();
		if (handlerNames.length > menuButtons.length)
			throw new Error(
				"There are " + handlerNames.length + " menu buttons defined, " +
				"but only " + menuButtons.length  + " objects!");

		this.buttons = handlerNames.map((handlerName, i) => {
			let handler = new MenuButtons.prototype[handlerName](menuButtons[i], pauseControl, playerViewControl, chat);
			this.initButton(handler, menuButtons[i], i);
			return handler;
		});

		this.topPanelHeight = Engine.GetGUIObjectByName("topPanel").size.bottom;
		this.expansionDistance = this.margin + this.buttonHeight * (1 + handlerNames.length);
		let size = this.menuButtonPanel.size;
		size.top = this.topPanelHeight - this.expansionDistance;
		size.bottom = this.topPanelHeight;
		this.menuButtonPanel.size = size;
		this.menuButtonPanel.hidden = true;
	}

	rebuild()
	{
		this.menuButton.tooltip = sprintf(translate("Press %(hotkey)s to toggle this menu."), {
			"hotkey": colorizeHotkey("%(hotkey)s", this.menuButton.hotkey),
		});
	}

	/**
	 * This function may be overwritten to change the button order.
	 */
	getHandlerNames()
	{
		return Object.keys(MenuButtons.prototype);
	}

	toggle()
	{
		if (this.isOpen)
			this.retract();
		else
			this.expand();
	}

	close()
	{
		if(this.isOpen)
			this.retract();
	}

	initButton(handler, button, i)
	{
		button.onPress = () => {
			this.retract();
			handler.onPress();
		};

		let size = button.size;
		size.top = this.buttonHeight * (i + 1) + this.margin;
		size.bottom = this.buttonHeight * (i + 2);
		button.size = size;

		button.hidden = false;
	}

	expand()
	{
		this.isOpen = true;
		GuiAnimator.animateObjectProperties(this.menuButtonPanel, {
			"size": {
				"top": 0,
				"bottom": this.expansionDistance
			}
		}, { "duration": this.AnimationDuration, "curve": "ease-out" },
		{ "onStart": (() => { this.menuButtonPanel.hidden = false;} ).bind(this)})
	}

	retract()
	{
		this.isOpen = false;
		GuiAnimator.animateObjectProperties(this.menuButtonPanel, {
			"size": {
				"top": this.topPanelHeight - this.expansionDistance,
				"bottom": this.topPanelHeight
			}
		}, { "duration": this.AnimationDuration, "curve": "ease-out" },
		{ "onComplete": (() => { this.menuButtonPanel.hidden = true;} ).bind(this)})
	}
}

/**
 * Menu retraction and expansion time in milliseconds.
 */
Menu.prototype.AnimationDuration = 250;
