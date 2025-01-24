/**
Distribute buttons equally across all available horizontal space.

Also increases the buttons height equally so they fit two lines of
text, if the caption of at least one button doesn't fit in a single
line.
*/
function distributeButtonsHorizontally(buttons)
{
	const betweenButtonMargin = 8;
	const regularButtonHeight = 28;
	const multilineButtonHeight = 42;
	const numButtons = buttons.length;

	const buttonParents = buttons.map((button) => { return button.parent; });
	if (new Set(buttonParents).size !== 1) {
		warn("Buttons need to have the same parent object to be distributed horizontally.");
		return;
	}

	const parentWidth = buttons[0].parent.getComputedSize().right - buttons[0].parent.getComputedSize().left;
	const buttonWidth = (parentWidth - betweenButtonMargin * (numButtons - 1)) / numButtons;

	const needsSecondLine = buttons.some(button => {
		const captionWidth = Engine.GetTextWidth(button.font, button.caption) + 10;
		return captionWidth > buttonWidth && (button.caption.indexOf(" ") !== -1 || button.caption.indexOf("-") !== -1)
	});

	let buttonHeight = needsSecondLine ? multilineButtonHeight : regularButtonHeight;

	buttons.forEach((button, i) => {
		button.size = new GUISize(
			(betweenButtonMargin / 2),
			-(buttonHeight / 2),
			-(betweenButtonMargin / 2),
			(buttonHeight / 2),
			(i * 100 / numButtons),
			50,
			((i + 1) * 100 / numButtons),
			50
		);
	});
}

function setButtonCaptionsAndVisibility(buttons, captions, cancelHotkey, name)
{
	return new Promise(resolve => {
		captions.forEach((caption, i) => {
			buttons[i] = Engine.GetGUIObjectByName(name + (i + 1));
			buttons[i].caption = caption;
			buttons[i].hidden = false;
			buttons[i].onPress = resolve.bind(null, i);

		});
		cancelHotkey.onPress = buttons[0].onPress;
	});
}
