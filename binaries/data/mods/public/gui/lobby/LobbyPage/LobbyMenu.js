class LobbyMenu
{
	constructor()
	{
		this.moreButton = Engine.GetGUIObjectByName("moreButton");
		this.lobbyMenuPanel = Engine.GetGUIObjectByName("lobbyMenuPanel");

		if (!this.moreButton || !this.lobbyMenuPanel)
			return;

		this.moreButton.onPress = this.toggle.bind(this);

		const menuButtons = this.lobbyMenuPanel.children;
		this.margin = menuButtons[0].size.top;
		this.buttonHeight = menuButtons[0].size.bottom;

		const handlerNames = this.getHandlerNames();

		if (handlerNames.length > menuButtons.length)
			throw new Error(
				"There are more handlers than available button objects: " +
				handlerNames.length + " vs " + menuButtons.length
			);

		this.buttons = handlerNames.map((handlerName, i) => {
			const handler = new LobbyMenuButtons.prototype[handlerName](menuButtons[i]);
			this.initButton(handler, menuButtons[i], i);
			return handler;
		});

		this.totalHeight = this.margin + this.buttonHeight * handlerNames.length + this.margin;

		this.lobbyMenuPanel.hidden = true;
	}

	getHandlerNames()
	{
		return [
			"StructureTree",
			"Hotkeys",
			"LastGameSummary",
			"Options"
		];
	}

	toggle()
	{
		const isCurrentlyHidden = this.lobbyMenuPanel.hidden;
		this.lobbyMenuPanel.hidden = !isCurrentlyHidden;

		if (isCurrentlyHidden)
		{
			const size = this.lobbyMenuPanel.size;
			const anchorBottom = this.moreButton.size.top;

			size.top = anchorBottom - this.totalHeight;
			size.bottom = anchorBottom;
			size.right = this.moreButton.size.right;
			size.left = this.moreButton.size.right - 120;

			this.lobbyMenuPanel.size = size;
		}
	}

	initButton(handler, button, i)
	{
		button.onPress = () => {
			this.lobbyMenuPanel.hidden = true;
			handler.onPress();
		};

		const size = button.size;
		size.top = this.margin + this.buttonHeight * i;
		size.bottom = this.margin + this.buttonHeight * (i + 1);
		button.size = size;

		button.hidden = false;
	}
}