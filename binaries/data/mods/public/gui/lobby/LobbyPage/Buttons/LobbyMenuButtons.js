class LobbyMenuButtons {}

LobbyMenuButtons.prototype.StructureTree = class
{
	constructor(button)
	{
		this.button = button;
		this.button.caption = translate("Structure Tree");
	}

	async onPress()
	{
		await pageLoop("page_structree.xml");
	}
};

LobbyMenuButtons.prototype.Hotkeys = class
{
	constructor(button)
	{
		this.button = button;
		this.button.caption = translate("Hotkeys");
	}

	async onPress()
	{
		await Engine.OpenChildPage("hotkeys/page_hotkeys.xml");
	}
};

LobbyMenuButtons.prototype.LastGameSummary = class
{
	constructor(button)
	{
		this.button = button;
		this.button.caption = translate("Last Game Summary");
	}

	async onPress()
	{
		await LastGameSummary();
	}
};

LobbyMenuButtons.prototype.Options = class
{
	constructor(button)
	{
		this.button = button;
		this.button.caption = translate("Options");
	}

	async onPress()
	{
		fireConfigChangeHandlers(await Engine.OpenChildPage("page_options.xml"));
	}
};