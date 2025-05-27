class TerrainGridBrowser extends GridBrowser
{
	constructor(guiObject)
	{
		super(guiObject);

		this.terrainList = [];

		this.items = this.container.children.map((imageObject, itemIndex) =>
			new TerrainGridBrowserItem(this, imageObject, itemIndex));

		this.container.onWindowResized = this.onWindowResized.bind(this);
	}

	updateTerrainList(terrainList, currentTerrainName)
	{
		this.terrainList = terrainList;
		this.itemCount = terrainList.length;

		this.resizeGrid();

		this.setSelectedIndex(this.terrainList.indexOf(currentTerrainName) || 0);
		this.goToPageOfSelected();
	}
}

TerrainGridBrowser.prototype.ItemRatio = 4 / 3;

TerrainGridBrowser.prototype.DefaultItemWidth = 200;

TerrainGridBrowser.prototype.MinItemWidth = 200;
