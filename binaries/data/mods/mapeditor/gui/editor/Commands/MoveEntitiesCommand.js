commandManagerComands.MoveEntities = class extends Command
{
	constructor(args)
	{
		super();
		this.entitiesId = args.entities;
		this.pivot = args.pivot;
		this.position = args.position;
		this.entitiesCmp = undefined;
	}

	getType()
	{
		return "MoveEntities";
	}

	execute()
	{
		let result = MapEditor.MapEditorInterfaceCall("GetCmpInfo", { "entities": this.entitiesId });
		if (!result.success)
		{
			warn("Failed to get component info for entities");
			return;
		}
		this.entitiesCmp = result.data;
		this.redo();
	}

	undo()
	{
		if (this.entitiesCmp === undefined)
			return;

		for (let cmpInfo of this.entitiesCmp)
		{
			MapEditor.MapEditorInterfaceCall("UpdateObjectPosition", {
				id: cmpInfo.id,
				x: cmpInfo.position.position.x,
				z: cmpInfo.position.position.z,
				rotation: cmpInfo.position.rotation,
			});
		}
	}

	redo()
	{
		let pivotPosition = this.entitiesCmp.find(cmpInfo => cmpInfo.id === this.pivot).position.position;
		let direction = { x: this.position.x - pivotPosition.x, z: this.position.z - pivotPosition.z };

		for (let cmpInfo of this.entitiesCmp)
		{
			MapEditor.MapEditorInterfaceCall("UpdateObjectPosition", {
				id: cmpInfo.id,
				x: cmpInfo.position.position.x + direction.x,
				z: cmpInfo.position.position.z + direction.z,
				rotation: cmpInfo.position.rotation,
			});
		}
	}

	mergeWith(command)
	{
		command.position = this.position;
	}
}
