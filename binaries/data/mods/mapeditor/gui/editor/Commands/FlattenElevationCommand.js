commandManagerComands.FlattenElevation = class extends Command
{
	constructor(args)
	{
		super();
		this.position = args.position;
		this.priority = args.priority;
		this.brush = args.brush;
		this.heightmapArrayDelta = MapEditor.CreateHeightmapArray();

		this.heightmapArrayDelta.Init();
	}

	getType()
	{
		return "FlattenElevation";
	}

	execute()
	{
		this.brush.UpdatePosition(this.position.x, this.position.y);
		let bottonLeft = this.brush.GetBottomLeft();
		let width = this.brush.GetWidth();
		let height = this.brush.GetHeight();

		this.heightmapArrayDelta.FlattenElevation(this.brush, this.priority);

		this.i0 = bottonLeft.x - 1;
		this.j0 = bottonLeft.y - 1;
		this.i1 = bottonLeft.x + width;
		this.j1 = bottonLeft.y + height;

		MapEditor.MakeDirtyTiles(this.i0, this.j0, this.i1, this.j1);
	}

	undo()
	{
		this.heightmapArrayDelta.Undo();
		MapEditor.MakeDirtyTiles(this.i0, this.j0, this.i1, this.j1);
	}

	redo()
	{
		this.heightmapArrayDelta.Redo();
		MapEditor.MakeDirtyTiles(this.i0, this.j0, this.i1, this.j1);
	}

	mergeWith(command)
	{
		if (this.getType() !== command.getType())
			return;

		command.heightmapArrayDelta.OverlayWith(this.heightmapArrayDelta);
		command.i0 = Math.min(command.i0, this.i0);
		command.j0 = Math.min(command.j0, this.j0);
		command.i1 = Math.max(command.i1, this.i1);
		command.j1 = Math.max(command.j1, this.j1);
	}
}
