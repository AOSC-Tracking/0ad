class EncyclopediaPage
{
	constructor()
	{
		this.civData = loadCivData(true, false);

		this.pageStateManager = new PageStateManager(this);
		this.eventManager = new EventManager(this);
		this.panelManager = new PanelManager(this);

		this.calculateAndSetGUISizes();
	}

	calculateAndSetGUISizes()
	{
		const pageSize = Engine.GetGUIObjectByName("encyclopediaPage").getComputedSize();
		// This.gui covers the entire screen (therefore panelSize.top = 0).
		const pageHeight = pageSize.bottom;
		const letteringHeight = pageHeight * 0.088;
		const letteringVerticalOffset = pageHeight * 0.024;

		// The lettering image file has an aspect ration of 8:1.
		// Its size is relative to the screen height to prevent it from taking up too much space on lower screen resolutions.
		// We have to set its size in here to avoid distortion between different screen aspect ratios.
		Engine.GetGUIObjectByName("lettering").size = new GUISize(-(letteringHeight * 4), letteringVerticalOffset, letteringHeight * 4, letteringVerticalOffset + letteringHeight, 50, 0, 50, 0);

	}
}

EncyclopediaPage.prototype.pathToArticles = "encyclopedia/";
