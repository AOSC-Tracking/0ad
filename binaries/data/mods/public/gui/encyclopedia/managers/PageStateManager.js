/**
 * This class stores the current state of the page.
 * Properties not relevant to the state (e.g. "activeArticle" on the introduction layer) must always reset to null
 * to avoid spillovers from past states which could hinder the event detection.
 */

class PageStateManager
{
	constructor(page)
	{
		this.page = page;
		Object.preventExtensions(this.state);
	}

	setActiveCategory(category)
	{
		this.applyModificationsToState({
			"activeLayer": "introduction",
			"activeCategory": category,
			"activeCiv": null,
			"activeSubcategory": null,
			"activeArticle": null
		});
	}

	setActiveCiv(civ)
	{
		this.applyModificationsToState({
			"activeLayer": "introduction",
			"activeCategory": "civilizations",
			"activeCiv": civ,
			"activeSubcategory": null,
			"activeArticle": null
		});
	}

	setActiveSubcategory(subcategory)
	{
		this.applyModificationsToState({
			"activeLayer": "selection",
			"activeSubcategory": subcategory,
			"activeArticle": null
		});
	}

	setActiveArticle(article)
	{
		this.applyModificationsToState({
			"activeLayer": "article",
			"activeArticle": article
		});
	}

	setActiveArticleFile(articleFile)
	{
		const articleName = articleFile.slice(articleFile.lastIndexOf("/") + 1, -5);
		this.applyModificationsToState({
			"activeLayer": "article",
			"activeArticle": articleName,
			"targetPath": articleFile
		});
	}

	applyModificationsToState(modifications)
	{
		const oldState = this.getState();
		let newState = {};
		for (let key of Object.keys(oldState))
			newState[key] = key in modifications ? modifications[key] : oldState[key];

		if (!modifications.targetPath)
			this.updateTargetPath(newState);

		this.setState(newState);
	}

	updateTargetPath(pageState)
	{
		let relativePath;

		switch(pageState.activeLayer)
		{
		case "introduction":
			relativePath =
				pageState.activeCiv ?
					pageState.activeCategory + "/" + pageState.activeCiv + "/introduction.json" :
					pageState.activeCategory + "/introduction.json";
			break;

		case "selection":
			relativePath =
				pageState.activeCiv ?
					pageState.activeCategory + "/" + pageState.activeCiv + "/" + pageState.activeSubcategory + "/" :
					pageState.activeCategory + "/" + pageState.activeSubcategory + "/";
			break;

		case "article":
			relativePath =
				pageState.activeCiv ?
					pageState.activeCategory + "/" + pageState.activeCiv + "/" + pageState.activeSubcategory + "/" + pageState.activeArticle + ".json" :
					pageState.activeCategory + "/" + pageState.activeSubcategory + "/" + pageState.activeArticle + ".json";

		default: break;
		}

		pageState.targetPath = this.page.pathToArticles + relativePath;
	}

	setState(state)
	{
		const oldState = this.getState();
		this.state = state;
		const newState = this.getState();

		if (oldState.activeLayer != newState.activeLayer)
			this.page.panelManager.updatePanelActivations(oldState, newState);

		this.page.eventManager.fireEventHandlers(oldState, newState);
	}

	getState()
	{
		return deepfreeze({ ...this.state });
	}
}

PageStateManager.prototype.state = {
	/**
	 * @property {string} activeLayer - The currently active page layer.
	 *
	 * The page has three layers, each linking to the one below:
	 *
	 * - "introduction":
	 *     Shown after selecting a category (and possibly a civilization).
	 *     Provides buttons to choose a subcategory.
	 *
	 * - "selection":
	 *     Shown after selecting a category, (possibly a civilization), and a subcategory.
	 *     Provides a list of all articles found in that specific subcategory.
	 *
	 * - "article":
	 *     Shown after opening a specific article.
	 *     (Obviously) displays the contents of that article.
	 */
	"activeLayer": "",

	/**
	 * @property {string} - The currently active category.
	 * Categories make up the first level of the encyclopeda tree. They correspond to directories in gui/encyclopedia/articles/.
	 * Examples: "about", "civilizations", "wars_and_battles".
	 */
	"activeCategory": "",

	/**
	 * @property {string|null} - The civCode of the currently active civilization.
	 * Civs can only be chosen and are only relevant inside the "civilizations" category. They form an intermediate step between category and subcategory.
	 * This property must be null elsewhere.
	 * Examples: "athen", "brit", "cart" .
	 */
	"activeCiv": null,

	/**
	 * @property {string|null} - The currently active subcategory.
	 * Subcategories make up the second level of the encyclopedia tree and directly contain a list of articles.
	 * They correspond to the directories inside the category (or civ) directory.
	 * This property must be null when the introduction layer is active (and no subcategory has been chosen yet).
	 * Examples: "warfare" (in "ancient_world/"), "military" (in "civilizations/athen/"), "ancient_china" (in "wars_and_battles/")
	 */
	"activeSubcategory": null,

	/**
	 * @property {string|null} - The currently active article.
	 * Articles make up the third and last layer of the encyclopedia tree.
	 * They are stored in .json files in the respective subcategory's directory.
	 * This property stores the article's name (not its title) without the .json extension.
	 * It must be null when the introduction or selection layers are active (and no specific article has been chosen yet).
	 * Examples: "hoplite" (inside "civilizations/athen/military/"), "merchantman" (inside "ancient_world/society/")
	 */
	"activeArticle": null,

	/**
	 * @property {string} - The directory or file that the current combination of activeCategory, activeCiv, and activeSubcategory is pointing to.
	 * Since activeCategory, activeCiv, activeSubcategory, activeArticle store nothing more than directory or file names, each combination
	 * can be tracked to one specifc directory (or file) containing the currently relevant data.
	 * Examples: "about/introduction.json", "nature/animals/", "civilizations/athen/introduction.json", "civilization/athen/military/hoplite.json"
	 */
	"targetPath": ""
};
