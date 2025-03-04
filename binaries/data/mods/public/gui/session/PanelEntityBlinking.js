/**
 * This class controls the blinking animation displayed over panel entites.
 */
class PanelEntityBlinking
{
    constructor(objectName, color1, color2, frequency)
    {
        this.guiObject = Engine.GetGUIObjectByName(objectName);
        this.color1 = color1;
        this.color2 = color2;
        this.frequency = frequency;
		this.blinkingCounter = 0;
        this.isBlinking = false;

        this.guiObject.sprite = "color:" + rgbToGuiColor(this.color1, 0);
        this.guiObject.hidden = false;
    }

    start()
    {
		if (!this.isBlinking)
        {
            GuiAnimator.animateObjectPropertiesPeriodically(this.guiObject,
                { "color": this.color1 }, { "color": this.color2 },
                { "curve": "ease-in-out-aggressive", "duration": this.frequency },
                { "onComplete": (() => {
                    this.blinkingCounter++;

                    if (this.blinkingCounter >= 12)
                        this.fadeOut();
                }).bind(this)}
            );
            this.isBlinking = true;
        }
        else
            this.blinkingCounter = 0;
    }

    fadeOut()
    {
        this.isBlinking = false;
        GuiAnimator.animateObjectProperties(this.guiObject,
            { "color": { ...this.color1, "a": 0 } },
            { "curve": "ease-out", "duration": this.frequency * 10 }
        )
    }

    stop()
    {
        if (this.isBlinking)
            GuiAnimator.haltAnimationOfObjectProperties(this.guiObject, ["color"]);
        this.guiObject.hidden = true;
    }
}
