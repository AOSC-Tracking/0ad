commandManagerComands.RotateObjectsFromCenterPoint = class extends Command
{
	constructor(args)
	{
		super();
		this.entitiesId = args.entities;
		this.rotate = args.rotate;
		this.position = args.position;
		this.entitiesCmp = undefined;
		this.centerPoint = { x: 0, z: 0, y:0 };
		this.angleInitialRotation = 0;
	}

	getType()
	{
		return "RotateObjectsFromCenterPoint";
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

		let minPosition = { x: Infinity, z: Infinity, y: Infinity };
		let maxPosition = { x: -Infinity, z: -Infinity, y: -Infinity };
		let first = false;

		for (let cmpInfo of this.entitiesCmp)
		{
			if (!cmpInfo.position)
				continue;

			if (first)
			{
				first = false;
				minPosition = { x: cmpInfo.position.position.x, z: cmpInfo.position.position.z, y: cmpInfo.position.position.y };
				maxPosition = { x: cmpInfo.position.position.x, z: cmpInfo.position.position.z, y: cmpInfo.position.position.y };
				this.centerPoint.y = cmpInfo.position.position.y;
				continue;
			}

			if (cmpInfo.position.position.x < minPosition.x)
				minPosition.x = cmpInfo.position.position.x;

			if (cmpInfo.position.position.x > maxPosition.x)
				maxPosition.x = cmpInfo.position.position.x;

			if (cmpInfo.position.position.z < minPosition.z)
				minPosition.z = cmpInfo.position.position.z;

			if (cmpInfo.position.position.z > maxPosition.z)
				maxPosition.z = cmpInfo.position.position.z;
		}

		this.centerPoint.x = minPosition.x + ((maxPosition.x - minPosition.x) * 0.5);
		this.centerPoint.z = minPosition.z + ((maxPosition.z - minPosition.z) * 0.5);

		this.angleInitialRotation = Math.atan2(this.position.x - this.centerPoint.x, this.position.z - this.centerPoint.z);
	}

	recalculateRotation()
	{
		let newAngle = Math.atan2(this.position.x - this.centerPoint.x, this.position.z - this.centerPoint.z);

		let globalAngle = this.angleInitialRotation - newAngle;

		for (let cmpInfo of this.entitiesCmp)
		{
			if (!cmpInfo.position)
				continue;

			let position = {...cmpInfo.position.position};

			let angle = Math.atan2(position.x - this.centerPoint.x, position.z - this.centerPoint.z);
			let localAngle = angle + (globalAngle - angle);
			let xCos = Math.cos(localAngle);
			let xSin = Math.sin(localAngle);

			position.x -= this.centerPoint.x;
			position.z -= this.centerPoint.z;

			let newX = position.x * xCos - position.z * xSin;
			let newZ = position.x * xSin + position.z * xCos;

			position.x = newX + this.centerPoint.x;
			position.z = newZ + this.centerPoint.z;

			let newAngle = cmpInfo.position.rotation.y - globalAngle;

			MapEditor.MapEditorInterfaceCall("UpdateObjectPosition", {
				id: cmpInfo.id,
				x: position.x,
				z: position.z,
				angle: this.rotate ? newAngle : undefined,
			});
		}
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
		this.recalculateRotation();
	}

	mergeWith(command)
	{
		command.position = this.position;
		command.rotate = this.rotate;
		command.recalculateRotation();
	}
}
