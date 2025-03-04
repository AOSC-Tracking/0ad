class BackgroundHandler
{
	constructor(layers)
	{
		this.backgroundLayers = layers.map((layer, i) =>
			new BackgroundLayer(layer, i));

		this.backgrounds = Engine.GetGUIObjectByName("backgrounds");
		this.backgrounds.onWindowResized = this.onWindowResized.bind(this);
		this.onWindowResized();
	}

	onWindowResized()
	{
		let size = this.backgrounds.getComputedSize();
		this.windowSize = deepfreeze(new GUISize(size.top, size.left, size.right, size.bottom));
		for (const layer of this.backgroundLayers)
			layer.initializeAnimationCycle(this.windowSize);
	}
}

class BackgroundLayer
{
	constructor(layer, i)
	{
		this.layer = layer;

		this.background = Engine.GetGUIObjectByName("background[" + i + "]");
		this.background.sprite = this.layer.sprite;
		this.background.z = i;
		this.background.hidden = false;
	}

	initializeAnimationCycle(windowSize)
	{
		if (!this.layer.animation)
			return;

		this.windowSize = windowSize;
		const height = windowSize.bottom - windowSize.top;
		const width = height * this.AspectRatio;
		const distance = this.layer.animation.relativeDistance * width;
		const offset = (this.layer.relativeHorizontalOffset || 0) * width;

		const startingSize = Object.assign({}, windowSize);
		const targetSize = Object.assign({}, windowSize);
		if (this.layer.tiling)
		{
			startingSize.left = offset;
			targetSize.left = -Math.abs(distance) + offset;
		}
		else
		{
			const horizontalCenter = windowSize.right / 2;
			const rightPosition = horizontalCenter + distance / 2 + offset;
			const leftPosition = windowSize.right / 2 - distance / 2 + offset;
			// The images have an aspect ratio of 2:1.
			// And 'height' here stands for half their width.
			startingSize.left = rightPosition - height;
			startingSize.right = rightPosition + height;
			targetSize.left = leftPosition - height;
			targetSize.right = leftPosition + height;
		}

		this.background.size = new GUISize(startingSize.left, startingSize.top, startingSize.right, startingSize.bottom);

		GuiAnimator.animateObjectPropertiesPeriodically(this.background,
			{ "size": targetSize }, { "size": startingSize },
			{ "duration": this.layer.animation.duration * 1000, "curve": "ease-in-out-subtle" },
		);
	}
}

BackgroundLayer.prototype.AspectRatio = 16 / 9;
