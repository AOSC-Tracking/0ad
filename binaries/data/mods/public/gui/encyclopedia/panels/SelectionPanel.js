class SelectionPanel
{
	constructor(page)
	{
		this.page = page;

		this.gui = Engine.GetGUIObjectByName("selectionPanel");
		this.title = Engine.GetGUIObjectByName("selectionTitle");
		this.warning = Engine.GetGUIObjectByName("selectionWarning");
		this.warning.hidden = true;
		this.selection = Engine.GetGUIObjectByName("selectionList");

		this.page.eventManager.registerEventHandler("onActiveSubcategoryChange", this.onActiveSubcategoryChange.bind(this), this);
	}

	onActiveSubcategoryChange(pageState)
	{
		this.title.caption =
			pageState.activeCiv ?
				g_EncyclopediaStructure.civilizations.subdirectories[pageState.activeCiv].subdirectories[pageState.activeSubcategory].title :
				g_EncyclopediaStructure[pageState.activeCategory].subdirectories[pageState.activeSubcategory].title;

		this.setupList(pageState.targetPath);
	}

	setupList(targetdir)
	{
		const list = Engine.ListDirectoryFiles(targetdir, "*.json", false);
		this.warning.hidden = list.length != 0;
		this.selection.list = list.map(file => {
			return Engine.ReadJSONFile(file).title;
		});

		// A double-click opens the article.
		this.selection.selected = -1;
		let selected = this.selection.selected;
		this.selection.onSelectionChange = () => {
			if (this.selection.selected == selected && selected != -1)
				this.page.pageStateManager.setActiveArticleFile(list[selected]);

			selected = this.selection.selected;
		};
	}

}
