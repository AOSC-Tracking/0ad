objectTools.Entities = {
	name: translateWithContext("Map Editor", "Entities"),
	onChange: function(filter)
	{
		let entities = MapEditor.GetTemplates("simulation");

		let filterEntities =  filter && filter !== "" ? entities.filter((entity) => entity.toLowerCase().includes(filter.toLowerCase())) : entities;
		return {
			labels: filterEntities,
			values: filterEntities
		};
	},
	state: "objectPreview"
};

objectTools.Actors = {
	name: translateWithContext("Map Editor", "Actors"),
	onChange: function(filter)
	{
		let actors = MapEditor.GetTemplates("actor");
		let filterActors =  filter && filter !== "" ? actors.filter((actor) => actor.toLowerCase().includes(filter.toLowerCase())) : actors;
		let formatActors = filterActors.map((entity) => entity.substr(6));
		return {
			labels: formatActors,
			values: filterActors
		};
	},
	state: "objectPreview"
}
