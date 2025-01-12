/**
Distribute buttons equally across all available horizontal space.

Also increases the buttons height equally if the caption of at least
one button doesn't fit.
*/
function distributeButtonsHorizontally(buttons)
{
	const betweenButtonMargin = 8;
	const regularButtonHeight = 28;
	const multilineButtonHeight = 42;
	const numButtons = buttons.length;

	let buttonHeight = regularButtonHeight;

	buttons.forEach((button, i) => {
		button.size = new GUISize(
			(betweenButtonMargin / 2),
			-(buttonHeight / 2),
			-(betweenButtonMargin / 2),
			(buttonHeight / 2),
			(i * 100 / numButtons),
			50,
			i === numButtons ? 100 : ((i + 1) * 100 / numButtons),
			50
		);
		const captionWidth = Engine.GetTextWidth(button.font, button.caption) + 10;
		const buttonWidth = button.getComputedSize().right - button.getComputedSize().left;
		if (captionWidth > (buttonWidth) && (button.caption.indexOf(" ") !== -1 || button.caption.indexOf("-") !== -1)) {
			buttonHeight = multilineButtonHeight;
		}
	});

	if (buttonHeight === regularButtonHeight) {
		return;
	}

	buttons.forEach((button, i) => {
		button.size = new GUISize(
			button.size.left,
			-(buttonHeight / 2),
			button.size.right,
			(buttonHeight / 2),
			button.size.rleft,
			50,
			button.size.rright,
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
