/**
 * Displays an overlay while any player pauses the game.
 * Indicates which players have paused.
 */
class PauseOverlay
{
	constructor(pauseControl)
	{
		this.pauseControl = pauseControl;

		this.pausedByText = Engine.GetGUIObjectByName("pausedByText");
		this.pausedByText.hidden = !g_IsNetworked;

		this.pauseOverlay = Engine.GetGUIObjectByName("pauseOverlay");
		this.pauseOverlay.onPress = this.onPress.bind(this);

		this.resumeMessage = Engine.GetGUIObjectByName("resumeMessage");

		registerNetworkStatusChangeHandler(this.rebuild.bind(this));
		pauseControl.registerPauseHandler(this.rebuild.bind(this));
	}

	onPress()
	{
		if (this.pauseControl.explicitPause)
			this.pauseControl.setPaused(false, true);
	}

	rebuild()
	{
		let isPaused = !this.pauseControl.explicitPause && !this.pauseControl.pausingClients.length || g_Disconnected;
		if (isPaused)
		{
			if (!this.pauseOverlay.hidden)
			{
				this.pauseOverlay.hidden = true;
				GuiAnimator.animateObjectProperties("blackOverlay",
					{ "color": { "a": 0 } },
					{ "duration": this.FadingDuration, "curve": "ease-in-out-subtle" }
				);
			}
			return;
		}
		else if (this.pauseOverlay.hidden)
		{
			this.pauseOverlay.hidden = false;
			GuiAnimator.animateObjectProperties("blackOverlay",
				{ "color": { "a": this.TargetOpacity } },
				{ "duration": this.FadingDuration, "curve": "ease-in-out-subtle" }
			);
		}

		this.resumeMessage.hidden = !this.pauseControl.explicitPause;

		this.pausedByText.caption = sprintf(translate(this.PausedByCaption), {
			"players": this.pauseControl.pausingClients.map(guid =>
				colorizePlayernameByGUID(guid)).join(translateWithContext("Separator for a list of players", ", "))
		});
	}
}

PauseOverlay.prototype.PausedByCaption = markForTranslation("Paused by %(players)s");

PauseOverlay.prototype.FadingDuration = 300;

PauseOverlay.prototype.TargetOpacity = 185;
