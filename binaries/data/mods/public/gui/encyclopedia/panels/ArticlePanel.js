class ArticlePanel
{
	constructor(page)
	{
		this.page = page;

		this.gui = Engine.GetGUIObjectByName("articlePanel");
		this.title = Engine.GetGUIObjectByName("articleTitle");
		this.textField = Engine.GetGUIObjectByName("articleTextField");

		this.page.eventManager.registerEventHandler("onActiveArticleChange", this.onActiveArticleChange.bind(this), this);
	}

	onActiveArticleChange(pageState)
	{
		const json = Engine.ReadJSONFile(pageState.targetPath);
		this.title.caption = json.title;
		// The line breaks are added for aesthetic reasons.
		this.textField.caption = "\n" + json.content + "\n";
	}
}
