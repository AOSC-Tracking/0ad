/**
 * This class is implemented by game settings that are controlled by a slider.
 */
class GameSettingControlSlider extends GameSettingControl
{
	constructor(type, ...args)
	{
		super(...args);

		this.isInGuiUpdate = false;
		this.isPressing = false;
		this.TitleCaption = type.titleCaption;
		this.Tooltip = type.Tooltip;

		this.slider.onValueChange = this.onValueChange.bind(this, type.attributeName);
		this.slider.onPress = this.onPress.bind(this);
		this.slider.onRelease = this.onRelease.bind(this);

		if (type.minValue !== undefined)
			this.slider.min_value = type.minValue;

		if (type.maxValue !== undefined)
			this.slider.max_value = type.maxValue;

		for (const [setting, values] of Object.entries(type.triggers))
			g_GameSettings[setting].watch(type.render.bind(this), values);

		type.render.call(this);
	}

	setControl(gameSettingControlManager)
	{
		let row = gameSettingControlManager.getNextRow("sliderSettingFrame");
		this.frame = Engine.GetGUIObjectByName("sliderSettingFrame[" + row + "]");
		this.slider = Engine.GetGUIObjectByName("sliderSettingControl[" + row + "]");
		this.valueLabel = Engine.GetGUIObjectByName("sliderSettingLabel[" + row + "]");

		let labels = this.frame.children[0].children;
		this.title = labels[0];
		this.label = labels[1];
	}

	setControlTooltip(tooltip)
	{
		this.slider.tooltip = tooltip;
		this.valueLabel.tooltip = tooltip;
	}

	setControlHidden(hidden)
	{
		this.slider.hidden = hidden;
		this.valueLabel.hidden = hidden;
	}

	setSelectedValue(value, caption)
	{
		if (!this.isPressing)
		{
			this.isInGuiUpdate = true;
			this.slider.value = value;
			this.isInGuiUpdate = false;
		}

		this.label.caption = caption;
		this.valueLabel.caption = caption;
	}

	onValueChange(attributeName)
	{
		if (this.isInGuiUpdate || this.timer)
			return;

		this.timer = setTimeout(() => {
			g_GameSettings[attributeName].setValue(this.slider.value);
			this.gameSettingsController.setNetworkInitAttributes();
			delete this.timer;
		}, this.Timeout);
	}

	onPress()
	{
		this.isPressing = true;
	}

	onRelease()
	{
		this.isPressing = false;
	}
}

GameSettingControlSlider.prototype.Timeout = 50;

GameSettingControlSlider.prototype.UnknownValue =
	translateWithContext("settings value", "Unknown");
