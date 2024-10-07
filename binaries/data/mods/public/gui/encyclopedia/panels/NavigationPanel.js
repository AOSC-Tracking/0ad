var g_Categories = Object.keys(g_EncyclopediaStructure);

const navigationButtons = [
	{
		"caption": "Structure Tree",
		"onPress": pageLoop.bind(null, "page_structree.xml")
	},
	{
		"caption": "Civilisation Overview",
		"onPress": pageLoop.bind(null, "page_civinfo.xml")
	},
	{
		"caption": "Main Menu",
		"onPress": () => {
			Engine.SwitchGuiPage("page_pregame.xml");
		}
	}
];

const categoryButtonHeight = 35;
const categoryButtonDist = 5;
const categoryPanelAbsoluteMargin = -60;
const categoryPanelRelativeMargin = 100 / 3;

const navigationButtonHeight = 30;
const navigationButtonDist = 5;
const navigationButtonPadding = 17;


class NavigationPanel
{
	constructor(page)
	{
		this.page = page;

		this.gui = Engine.GetGUIObjectByName("navigationPanel");
		this.categoryButtons = Engine.GetGUIObjectByName("categoryButtons").children;
		this.lastHighlightedCategoryButtonIndex = -1;
		this.navigationButtons = Engine.GetGUIObjectByName("navigationButtons").children;
		this.heading = Engine.GetGUIObjectByName("categoryButtonHeading");
		this.categoryPanel = Engine.GetGUIObjectByName("categoryPanel");
		this.mainMenuButton = Engine.GetGUIObjectByName("mainMenuButton");

		this.page.eventManager.registerEventHandler("onActiveCategoryChange", this.onActiveCategoryChange.bind(this), this);

		this.calculateAndSetGUISizes();
		this.buildCategoryButtons();
		this.buildNavigationButtons();
	}

	calculateAndSetGUISizes()
	{
		// Margin describes the space surrounding the panel on the outside, padding on the inside.
		// The panel is placed to the left edge of the screen (this.gui.getComputedSize().left = 0) therefore 'right' determines the width.
		this.categoryPanelMargin = this.gui.getComputedSize().right * 0.3 - 52;
		this.categoryPanelPadding = this.categoryPanelMargin / 2;
	}

	buildCategoryButtons()
	{
		const categories = Object.keys(g_EncyclopediaStructure);

		// The heading is placed above the buttons and outside of the buttonPanel.
		this.heading.size = new GUISize(0, -(categoryButtonHeight + categoryButtonDist), 0, -categoryButtonDist, 0, 0, 100, 0);
		this.categoryPanel.size = new GUISize(this.categoryPanelMargin, 0, -this.categoryPanelMargin,
			categories.length * categoryButtonHeight + (categories.length - 1) * categoryButtonDist + 2 * this.categoryPanelPadding, 0, 25, 100, 25);

		this.categoryButtons.forEach((button, i) => {
			const category = categories[i];
			button.hidden = !category;
			if (button.hidden)
				return;
			button.caption = g_EncyclopediaStructure[category].title;
			button.size = new GUISize(
				this.categoryPanelPadding, i * (categoryButtonHeight + categoryButtonDist) + this.categoryPanelPadding,
				-this.categoryPanelPadding, i * (categoryButtonHeight + categoryButtonDist) + categoryButtonHeight + this.categoryPanelPadding,
				0, 0, 100, 0);
			button.onPress = () => {
				this.page.pageStateManager.setActiveCategory(category);
			};
		});
	}

	buildNavigationButtons()
	{
		// The navigationButtons are anchored to the bottom, and are drawn from the bottom up for simplicity.
		// We therefore need to loop throught the items from back to front (since the first item is supposed to be at the top).
		this.navigationButtons.forEach((button, i) => {
			const buttonData = navigationButtons[navigationButtons.length - i - 1];
			button.hidden = !buttonData;
			if (button.hidden)
				return;
			button.caption = buttonData.caption;
			button.onPress = buttonData.onPress;

			button.size = new GUISize(
				navigationButtonPadding,
				-(i * (navigationButtonHeight + navigationButtonDist) + navigationButtonHeight + navigationButtonPadding),
				-navigationButtonPadding,
				-(i * (navigationButtonHeight + navigationButtonDist) + navigationButtonPadding),
				0, 100, 100, 100);
		});
	}

	onActiveCategoryChange(pageState)
	{
		const newIndex = g_Categories.indexOf(pageState.activeCategory);
		if (this.lastHighlightedCategoryButtonIndex != -1)
			this.categoryButtons[this.lastHighlightedCategoryButtonIndex].sprite = "StoneButton";
		this.categoryButtons[newIndex].sprite = "StoneButtonOver";
		this.lastHighlightedCategoryButtonIndex = newIndex;
	}

}
