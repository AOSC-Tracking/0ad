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

	let y1 = "50%-" + (regularButtonHeight / 2);
	let y2 = "50%+" + (regularButtonHeight / 2);
	const buttonWidths = [];

	buttons.forEach((button, i) => {
		let x1 = i === 0 ? (betweenButtonMargin / 2) : (i * 100 / numButtons + "%+" + (betweenButtonMargin / 2));
		let x2 = i === numButtons - 1 ? "100%-" + (betweenButtonMargin / 2) : ((i + 1) * 100 / numButtons + "%-" + (betweenButtonMargin / 2));
		buttonWidths[i] = {"x1": x1, "x2": x2}
		button.size = x1 + " " + y1 + " " + x2 + " " + y2

		const captionWidth = Engine.GetTextWidth(button.font, button.caption) + 10;
		const buttonWidth = button.getComputedSize().right - button.getComputedSize().left;
		if (captionWidth > (buttonWidth) && (button.caption.indexOf(" ") !== -1 || button.caption.indexOf("-") !== -1)) {
			y1 = "50%-" + (multilineButtonHeight / 2);
			y2 = "50%+" + (multilineButtonHeight / 2);
		}
	});

	buttons.forEach((button, i) => {
		button.size = buttonWidths[i].x1 + " " + y1 + " " + buttonWidths[i].x2 + " " + y2;
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
