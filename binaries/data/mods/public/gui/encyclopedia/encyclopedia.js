function init()
{
	var g_EncyclopediaPage = new EncyclopediaPage();
	g_EncyclopediaPage.pageStateManager.setState({
		"activeLayer": "introduction",
		"activeCategory": "about",
		"activeCiv": null,
		"activeSubcategory": null,
		"activeArticle": null,
		"targetPath": "gui/encyclopedia/articles/about/introduction.json"
	});
}
