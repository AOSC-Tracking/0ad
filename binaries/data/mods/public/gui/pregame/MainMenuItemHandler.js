/**
 * This class sets up the main menu buttons, animates submenu that opens when
 * clicking on category buttons, assigns the defined actions and hotkeys to every button.
 */
class MainMenuItemHandler
{
	constructor(menuItems)
	{
		this.menuItems = menuItems;
		this.lastTickTime = Date.now();

		this.lastOpenItem = undefined;

		this.mainMenu = Engine.GetGUIObjectByName("mainMenu");
		this.mainMenuButtons = Engine.GetGUIObjectByName("mainMenuButtons");
		this.submenu = Engine.GetGUIObjectByName("submenu");
		this.submenuButtons = Engine.GetGUIObjectByName("submenuButtons");
		this.MainMenuPanelRightBorderTop = Engine.GetGUIObjectByName("MainMenuPanelRightBorderTop");
		this.MainMenuPanelRightBorderBottom = Engine.GetGUIObjectByName("MainMenuPanelRightBorderBottom");

		this.setupMenuButtons(this.mainMenuButtons.children, this.menuItems);
		this.setupHotkeys(this.menuItems);

		Engine.GetGUIObjectByName("closeMenuButton").onPress = (() => {
			if (!this.submenu.hidden)
				this.retractSubmenu();
		}).bind(this);
	}

	setupMenuButtons(buttons, menuItems)
	{
		buttons.forEach((button, i) => {
			let item = menuItems[i];
			button.hidden = !item;
			if (button.hidden)
				return;

			button.size = new GUISize(
				0, (this.ButtonHeight + this.Margin) * i,
				0, (this.ButtonHeight + this.Margin) * i + this.ButtonHeight,
				0, 0, 100, 0);
			button.caption = item.caption;
			button.tooltip = item.tooltip;
			button.enabled = item.enabled === undefined || item.enabled();
			button.onPress = this.pressButton.bind(this, item, i);
			button.hidden = false;
		});

		if (buttons.length < menuItems.length)
			error("GUI page has space for " + buttons.length + " menu buttons, but " + menuItems.length + " items are provided!");
	}

	/**
	 * Expand selected submenu, or collapse if it already is expanded.
	 */
	pressButton(item, i)
	{
		if (this.submenu.hidden)
			this.performButtonAction(item, i);
		else
		{
			if (this.lastOpenItem && this.lastOpenItem != item)
			{
				this.hideSubmenu();
				this.performButtonAction(item, i);
			}
			else
			{
				this.retractSubmenu();
				this.lastOpenItem = undefined;
			}
		}
	}

	/**
	 * Expand submenu or perform action specified by the button object.
	 */
	performButtonAction(item, i)
	{
		this.lastOpenItem = item;

		if (item.onPress)
			item.onPress();
		else
			this.openSubmenu(i);
	}

	setupHotkeys(menuItems)
	{
		for (let i in menuItems)
		{
			let item = menuItems[i];
			if (item.onPress && item.hotkey)
				Engine.SetGlobalHotkey(item.hotkey, "Press", () => {
					this.hideSubmenu();
					item.onPress();
				});

			if (item.submenu)
				this.setupHotkeys(item.submenu);
		}
	}

	openSubmenu(i)
	{
		this.setupMenuButtons(this.submenuButtons.children, this.menuItems[i].submenu);

		let top = this.mainMenuButtons.children[i].getComputedSize().top;

		this.submenu.size = new GUISize(
			this.submenu.size.left, top - this.Margin,
			this.submenu.size.right, top + (this.ButtonHeight + this.Margin) * this.menuItems[i].submenu.length);

		const submenuWidth = this.mainMenu.size.right - this.submenu.size.left;
		GuiAnimator.animateObjectProperties(this.submenu, {
			"size": {
				"left": this.submenu.size.left + submenuWidth,
				"right": this.submenu.size.right + submenuWidth
			}}, { "duration": this.SubmenuAnimationDuration, "curve": "ease-out" });

		this.submenu.hidden = false;

		{
			let size = this.MainMenuPanelRightBorderTop.size;
			size.bottom = this.submenu.size.top + this.Margin;
			size.rbottom = 0;
			this.MainMenuPanelRightBorderTop.size = size;
		}

		{
			let size = this.MainMenuPanelRightBorderBottom.size;
			size.top = this.submenu.size.bottom;
			this.MainMenuPanelRightBorderBottom.size = size;
		}
	}

	hideSubmenu()
	{
		GuiAnimator.revertLastAnimationsOnObject(this.submenu);
		this.submenu.hidden = true;
	}

	retractSubmenu()
	{
		GuiAnimator.animateObjectProperties(this.submenu, {
			"size": {
				"left": this.mainMenu.size.left,
				"right": this.mainMenu.size.right
			} },
			{ "duration": this.SubmenuAnimationDuration, "curve": "ease-out"},
			{ "onComplete": (() => {
				this.submenu.hidden = true;
				this.mendRightBorder(); }).bind(this) }
		);
	}

	mendRightBorder()
	{
		let size = this.MainMenuPanelRightBorderTop.size;
		size.top = 0;
		size.bottom = 0;
		size.rbottom = 100;
		this.MainMenuPanelRightBorderTop.size = size;
	}
}

/**
 * Vertical size per button.
 */
MainMenuItemHandler.prototype.ButtonHeight = 28;

/**
 * Distance between consecutive buttons.
 */
MainMenuItemHandler.prototype.Margin = 4;

/**
 * Submenu retraction and expansion time in milliseconds.
 */
MainMenuItemHandler.prototype.SubmenuAnimationDuration = 250
