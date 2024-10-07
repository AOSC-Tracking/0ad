const subcategoryButtonHeight = 35;
const subcategoryButtonDist = 25;

class IntroductionPanel
{
	constructor(page)
	{
		this.page = page;

		this.gui = Engine.GetGUIObjectByName("introductionPanel");
		this.title = Engine.GetGUIObjectByName("introductionTitle");
		this.text = Engine.GetGUIObjectByName("introductionText");
		this.civEmblem = Engine.GetGUIObjectByName("civEmblem");
		this.learnMore = Engine.GetGUIObjectByName("learnMore");
		this.textAddition = Engine.GetGUIObjectByName("civilizationsTextAddition");
		this.disclaimer = Engine.GetGUIObjectByName("disclaimer");
		this.disclaimer.caption = Engine.TranslateLines(Engine.ReadFile(this.page.pathToArticles + "about/disclaimer.txt"));
		this.subcategoryButtons = Engine.GetGUIObjectByName("subcategoryButtons").children;

		this.page.eventManager.registerEventHandler("onActiveCategoryChange", this.onActiveCategoryChange.bind(this), this);
		this.page.eventManager.registerEventHandler("onActiveCivChange", this.onActiveCivChange.bind(this), this);

		this.calculateAndSetGUISizes();

		this.civDropdown = new CivSelectDropdown(this.page.civData);
		this.civDropdown.registerHandler((civ => {
			if (civ)
				this.page.pageStateManager.setActiveCiv(civ);
		}).bind(this));
		this.civDropdown.civSelection.style = "BrownDropDown";
		this.civDropdown.civSelectionHeading.hidden = true;
	}

	calculateAndSetGUISizes()
	{
		const panelSize = this.gui.getComputedSize();
		const panelWidth = panelSize.right - panelSize.left;
		const panelHeight = panelSize.bottom - panelSize.top;
		const civEmblemRadius = panelHeight * 0.12 - 34;
		this.civEmblem.size = new GUISize(-civEmblemRadius, 50 - civEmblemRadius * 2, civEmblemRadius, 50, 50, 0, 50, 0);
		// On smaller screen sizes we can only fit two buttons in the available horizontal space (otherwise they will be to narrow for their captions).
		const buttonsPerLine = panelWidth > 720 ? 3 : 2;

		// SubcategoryButtons are horiontal, only three fit into a line (therefore the modulo).
		// Their width is determined by screen resolution.
		this.subcategoryButtons.forEach((button, i) => {
			button.size = new GUISize(
				subcategoryButtonDist / 2, Math.floor(i / buttonsPerLine) * (subcategoryButtonHeight + subcategoryButtonDist / 2),
				-(subcategoryButtonDist / 2), Math.floor(i / buttonsPerLine) * (subcategoryButtonHeight + subcategoryButtonDist / 2) + subcategoryButtonHeight,
				(i % buttonsPerLine) * (100 / buttonsPerLine), 0, ((i % buttonsPerLine) + 1) * (100 / buttonsPerLine), 0
			);
		});

	}

	rebuildSubcategoryButtons(subcategoryData)
	{
		const subcategories = Object.keys(subcategoryData);

		this.subcategoryButtons.forEach((button, i) => {
			const subcategory = subcategories[i];
			button.hidden = !subcategory;
			if (button.hidden)
				return;

			button.caption = subcategoryData[subcategory].title;
			button.onPress = () => {
				this.page.pageStateManager.setActiveSubcategory(subcategory);
			};
		});
		if (this.subcategoryButtons.length < subcategories.length)
			error("GUI page has space for " + this.subcategoryButtons.length + " subcategory buttons, but " + subcategories.length + " items are provided!");
	}

	onActiveCategoryChange(pageState)
	{
		const isCivCategorySelected = pageState.activeCategory == "civilizations";
		const isCivSelected = isCivCategorySelected && !!pageState.activeCiv;

		this.disclaimer.hidden = pageState.activeCategory != "about";
		this.textAddition.hidden = !isCivCategorySelected;
		this.civDropdown.civSelection.hidden = !isCivCategorySelected;
		if (isCivCategorySelected && !isCivSelected)
			this.civDropdown.civSelection.selected = -1;
		this.civEmblem.hidden = !isCivSelected;

		if (isCivSelected)
		{
			this.onCivSelected();
		}

		this.title.caption = g_EncyclopediaStructure[pageState.activeCategory].title;
		const json = Engine.ReadJSONFile(pageState.targetPath);
		this.text.caption = json.text;
		this.learnMore.hidden = !!json.hideLearnMore;
		this.learnMore.caption = json.learnMorePhrase || this.defaultLearnMorePhrase;

		if (g_EncyclopediaStructure[pageState.activeCategory].subdirectories &&
			// Don't show subcategory buttons on the civilization overview page without a civ selected yet.
			!(isCivCategorySelected && !isCivSelected))
			this.rebuildSubcategoryButtons(g_EncyclopediaStructure[pageState.activeCategory].subdirectories);
		else
			// Hide the subcategory buttons by rebuilding with empty data.
			this.rebuildSubcategoryButtons({});
	}

	onActiveCivChange(pageState)
	{
		if (pageState.activeCiv)
			this.onCivSelected(pageState);
		else
			this.onActiveCategoryChange(pageState);
	}

	onCivSelected(pageState)
	{
		this.textAddition.hidden = true;
		const json = Engine.ReadJSONFile(pageState.targetPath);
		this.learnMore.hidden = !!json.hideLearnMore;
		this.learnMore.caption = json.learnMorePhrase || this.defaultLearnMorePhrase;
		this.title.caption = g_EncyclopediaStructure.civilizations.subdirectories[pageState.activeCiv].title;
		this.text.caption = json.text;
		this.civEmblem.children[1].sprite = "stretched:" + this.page.civData[pageState.activeCiv].Emblem;

		this.rebuildSubcategoryButtons(g_EncyclopediaStructure.civilizations.subdirectories[pageState.activeCiv].subdirectories);
	}
}

IntroductionPanel.prototype.defaultLearnMorePhrase = "Learn more about the …";
