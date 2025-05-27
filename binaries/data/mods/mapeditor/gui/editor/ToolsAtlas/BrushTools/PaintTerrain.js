BrushTools.PaintTerrain = {
	name: translateWithContext("Map Editor", "Paint Terrain"),
	tooltip: translateWithContext("Map Editor", "Brush with left mouse button to paint texture dominantly,\nright mouse button to paint submissively.\nShift-left-click for eyedropper tool"),
	state: "paintTerrain",
	order: 0
}

BrushTools.ReplaceTerrain = {
	name: translateWithContext("Map Editor", "Replace Terrain"),
	tooltip: translateWithContext("Map Editor", "Replace all of a terrain texture with a new one"),
	state: "replaceTerrain",
	order: 1
}

BrushTools.FillTerrain = {
	name: translateWithContext("Map Editor", "Fill Terrain"),
	tooltip: translateWithContext("Map Editor", "Bucket fill a patch of terrain texture with a new one"),
	state: "fillTerrain",
	order: 2
}
