class GameSettingsPanel
{
	constructor(setupWindow, gameSettingTabs, gameSettingControlManager)
	{
		this.centerRightPanel = Engine.GetGUIObjectByName("centerRightPanel");
		this.settingTabButtonsFrame = Engine.GetGUIObjectByName("settingTabButtonsFrame");
		this.settingsPanelFrame = Engine.GetGUIObjectByName("settingsPanelFrame");

		this.gameSettingControlManager = gameSettingControlManager;
		this.gameSettingsPanelResizeHandlers = new Set();

		this.gameSetupPage = Engine.GetGUIObjectByName("gameSetupPage");
		this.gameSetupPage.onWindowResized = this.onWindowResized.bind(this);

		this.settingsPanel = Engine.GetGUIObjectByName("settingsPanel");

		this.isSlidingEnabled = Engine.ConfigDB_GetValue("user", this.ConfigNameSlide) == "true";

		gameSettingTabs.registerTabSelectHandler(this.updateSize.bind(this));
		setupWindow.controls.gameSettingsController.registerUpdateLayoutHandler(this.updateSize.bind(this));
		setupWindow.registerLoadHandler(this.triggerResizeHandlers.bind(this));
	}

	registerGameSettingsPanelResizeHandler(handler)
	{
		this.gameSettingsPanelResizeHandlers.add(handler);
	}

	triggerResizeHandlers()
	{
		for (let handler of this.gameSettingsPanelResizeHandlers)
			handler(this.settingsPanelFrame);
	}

	onWindowResized()
	{
		this.updateSize();
		this.triggerResizeHandlers();
	}

	updateSize()
	{
		this.gameSettingControlManager.updateSettingVisibility();
		this.positionSettings();

		let targetSize = this.settingsPanelFrame.size;
		const width = targetSize.right - targetSize.left;
		if (g_TabCategorySelected === undefined)
		{
			targetSize.left = this.settingTabButtonsFrame.size.left;
			targetSize.right = targetSize.left + width;
		}
		else
		{
			targetSize.right = this.settingTabButtonsFrame.size.left;
			targetSize.left = targetSize.right - width;
		}

		const difference = Math.abs(this.settingsPanelFrame.size.left - targetSize.left);

		if (difference === 0)
			return;

		if (this.isSlidingEnabled)
			GuiAnimator.animateObjectProperties(this.settingsPanelFrame,
				{ "size": targetSize },
				{ "curve": "ease-out", "duration": difference / this.AverageSlideSpeed},
				{ "onTick": (() => { this.triggerResizeHandlers(); }).bind(this)}
			);
		else
			this.settingsPanelFrame.size = targetSize;
	}

	/**
	 * Distribute the currently visible settings over the settings panel.
	 * First calculate the number of columns required, then place the setting frames.
	 */
	positionSettings()
	{
		let gameSetupPageSize = this.gameSetupPage.getComputedSize();

		let columnWidth = Math.min(
			this.MaxColumnWidth,
			(gameSetupPageSize.right - gameSetupPageSize.left + this.centerRightPanel.size.left) / 2);

		let settingsPerColumn;
		{
			let settingPanelSize = this.settingsPanel.getComputedSize();
			let maxSettingsPerColumn = Math.floor((settingPanelSize.bottom - settingPanelSize.top) / this.SettingHeight);
			let settingCount = this.settingsPanel.children.filter(child => !child.children[0].hidden).length;
			settingsPerColumn = settingCount / Math.ceil(settingCount / maxSettingsPerColumn);
		}

		let yPos = this.SettingMarginBottom;
		let column = 0;
		let settingsThisColumn = 0;

		let selectedTab = g_GameSettingsLayout[g_TabCategorySelected];
		if (!selectedTab)
			return;

		for (let name of selectedTab.settings)
		{
			let settingFrame = this.gameSettingControlManager.gameSettingControls[name].frame;
			if (settingFrame.hidden)
				continue;

			if (settingsThisColumn >= settingsPerColumn)
			{
				yPos = this.SettingMarginBottom;
				++column;
				settingsThisColumn = 0;
			}

			settingFrame.size = new GUISize(
				columnWidth * column,
				yPos,
				columnWidth * (column + 1) - this.SettingMarginRight,
				yPos + this.SettingHeight - this.SettingMarginBottom);

			yPos += this.SettingHeight;
			++settingsThisColumn;
		}

		{
			let size = this.settingsPanelFrame.size;
			size.right = size.left + (column + 1) * columnWidth;
			this.settingsPanelFrame.size = size;
		}
	}
}

GameSettingsPanel.prototype.ConfigNameSlide =
	"gui.gamesetup.settingsslide";

/**
 * Maximum width of a column in the settings panel.
 */
GameSettingsPanel.prototype.MaxColumnWidth = 470;

/**
 * Speed of the settings panel's  horizontal sliding animation in pixels per millisecond.
 */
GameSettingsPanel.prototype.AverageSlideSpeed = 1.2;

/**
 * Vertical size of a setting frame.
 */
GameSettingsPanel.prototype.SettingHeight = 36;

/**
 * Horizontal space between two setting frames.
 */
GameSettingsPanel.prototype.SettingMarginRight = 10;

/**
 * Vertical space between two setting frames.
 */
GameSettingsPanel.prototype.SettingMarginBottom = 2;
