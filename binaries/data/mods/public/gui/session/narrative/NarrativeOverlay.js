/**
 * This class manages and displays the narrative pages received from trigger scripts.
 */
class NarrativeOverlay
{
	constructor(pauseControl, pauseOverlay)
	{
		this.pauseControl = pauseControl;
		this.pauseOverlay = pauseOverlay;

		this.gui = Engine.GetGUIObjectByName("narrativeOverlay");
		this.background = Engine.GetGUIObjectByName("narrativeOverlayBackground");
		this.underlay = Engine.GetGUIObjectByName("narrativeOverlayBackgroundUnderlay");

		// Contains roughly the space inside the parchment visible.
		this.pageContainer = Engine.GetGUIObjectByName("narrativeOverlayPage");
		// Padded space inside the page container above the buttons, in which the text and title fields can be moved around.
		this.contentContainer = Engine.GetGUIObjectByName("narrativeOverlayContent");

		this.title = Engine.GetGUIObjectByName("narrativeOverlayTitle");
		this.image = Engine.GetGUIObjectByName("narrativeOverlayImage");
		this.text = Engine.GetGUIObjectByName("narrativeOverlayText");
		this.topOrnament = Engine.GetGUIObjectByName("narrativeOverlayOrnamentTop");
		this.bottomOrnament = Engine.GetGUIObjectByName("narrativeOverlayOrnamentBottom");
		this.buttonContainer = Engine.GetGUIObjectByName("narrativeOverlayButtons");
		this.previousButton = Engine.GetGUIObjectByName("narrativeOverlayPreviousButton");
		this.nextButton = Engine.GetGUIObjectByName("narrativeOverlayNextButton");

		// The objects we have to be careful not to overlap.
		this.borderingObjects = {
			"top": Engine.GetGUIObjectByName("civIcon"),
			"bottom": Engine.GetGUIObjectByName("selectionDetails")
		};

		this.gui.onWindowResized = () => {
			if (!this.gui.hidden)
				this.displayPage(this.pages[this.currentPageIndex]);
		};
		this.previousButton.onPress = () => {
			this.displayPage(this.pages[--this.currentPageIndex]);
		};
		this.previousButton.caption = this.PreviousButtonCaption;
		this.previousButton.tooltip = this.PreviousButtonTooltip;
		this.nextButton.onPress = () => {
			if (this.currentPageIndex < this.pages.length - 1)
				this.displayPage(this.pages[++this.currentPageIndex]);
			else
				this.close();
		};

		this.gui.hidden = true;
		this.pages = Engine.GuiInterfaceCall("GetInitialNarrativePages", {}).map(({ pageType, ...page }) => ({ "type": pageType, ...page }));
		this.currentPageIndex = this.pages.length - 1;
		this.pageAddedHandlers = new Set();

		this.initSizes();
	}

	/**
	 * Calculate some fixed sizes depending on the dimensions set in the prototype, so we don't have to do it every time a new page is displayed.
	 */
	initSizes()
	{
		const relativeVerticalPlacement = 43;
		this.backgroundSizes = {};
		this.underlaySizes = {};
		this.pageContainerSizes = {};
		for (const type of Object.values(this.PAGE_TYPE))
		{
			this.underlaySizes[type] = {
				"rleft": 50, "left": -this.UnderlayTextureDimensions[type].width / 2,
				"rright": 50, "right": +this.UnderlayTextureDimensions[type].width / 2,
				"rtop": relativeVerticalPlacement, "top": -this.UnderlayTextureDimensions[type].height / 2,
				"rbottom": relativeVerticalPlacement, "bottom": +this.UnderlayTextureDimensions[type].height / 2,
			};
			this.backgroundSizes[type] = {
				"rleft": 50, "left": -this.BackgroundTextureDimensions[type].width / 2,
				"rright": 50, "right": +this.BackgroundTextureDimensions[type].width / 2,
				"rtop": relativeVerticalPlacement, "top": -this.BackgroundTextureDimensions[type].height / 2,
				"rbottom": relativeVerticalPlacement, "bottom": +this.BackgroundTextureDimensions[type].height / 2,
			};
			this.pageContainerSizes[type] = {
				"rleft": 50, "left": -this.PageDimensions[type].width / 2,
				"rright": 50, "right": +this.PageDimensions[type].width / 2,
				// The content object is a child of the background object (and centered on it)
				// That's why we don't use relativeVerticalPlacement here.
				"rtop": 50, "top": -this.PageDimensions[type].height / 2,
				"rbottom": 50, "bottom": +this.PageDimensions[type].height / 2,
			};
		}
	}

	/**
	 * Helper method to scale sizes (down) by a given factor.
	 * It assumes the parent is scaled by the same factor, so it doesn't touch the relative (percent) size properties.
	 */
	scaleSizeBy(size, factor)
	{
		// Make sure not to modify the original.
		const newSize = {};
		["left", "top", "right", "bottom", "rleft", "rtop", "rright", "rbottom"].forEach((property, index) => {
			newSize[property] = size[property];
			if (index < 4)
				newSize[property] *= factor;
		});
		return newSize;
	}

	registerPageAddedHandler(handler)
	{
		this.pageAddedHandlers.add(handler);
	}

	firePageAddedHandlers()
	{
		for (const handler of this.pageAddedHandlers)
			handler();
	}

	hasPagesToShow()
	{
		return this.pages.length > 0;
	}

	open()
	{
		closeOpenDialogs();
		// Pause the game. Even in multiplayer; players should be able to take their time to read the narrative.
		this.pauseControl.setPaused(true, true);
		// Make sure players can't accidentally resume the game in the background while this window is still shown.
		this.pauseOverlay.setButtonEnabled(false);
		this.gui.hidden = false;
	}

	close()
	{
		this.pauseControl.setPaused(false, true);
		this.pauseOverlay.setButtonEnabled(true);
		this.gui.hidden = true;
	}

	addPage(page)
	{
		this.pages.push(page);
		if (this.gui.hidden)
		{
			this.open();
			this.currentPageIndex++;
			this.displayPage(page);
		}
		else
			this.updateButtons();
		this.firePageAddedHandlers();
	}

	loadFirstPage()
	{
		if (this.gui.hidden && this.hasPagesToShow())
		{
			this.open();
			this.displayPage(this.pages[this.currentPageIndex = 0]);
		}
	}

	displayPage(page)
	{
		// Titles and images are optional, but all pages need a text.
		this.title.caption = page.title ? translate(page.title) : "";
		this.text.caption = translate(page.text);
		this.text.text_align = page.textAlign || "center";
		this.image.hidden = page.image === undefined;
		if (!this.image.hidden)
			this.image.sprite = "stretched:narratives/" + page.image;

		this.calculateAndSetLayoutSizes(page);
		this.updateButtons();
	}

	calculateAndSetLayoutSizes(page)
	{
		const pageMargin = 50;
		// On small screen resolutions there isn't enough space to display the large and sometimes even medium pages in their full size.
		// In those cases we have to scale down everything by some factor (including the potentially custom layout).
		const availableHeight = this.borderingObjects.bottom.getComputedSize().top - this.borderingObjects.top.getComputedSize().bottom - 2 * pageMargin;
		const customLayoutScaleFactor = Math.min(1, availableHeight / this.PageDimensions[page.type].height);
		// If the large parchment background would be scaled smaller than the medium one is by default, just use that instead.
		const clampedPageType = (page.type == this.PAGE_TYPE.LARGE && availableHeight <= this.PageDimensions[this.PAGE_TYPE.MEDIUM].height) ? this.PAGE_TYPE.MEDIUM : page.type;
		const backgroundScaleFactor = Math.min(1, availableHeight / this.PageDimensions[clampedPageType].height);
		const defaultLayoutScaleFactor = this.DefaultLayoutScaleFactor[clampedPageType] * backgroundScaleFactor;

		this.setBackground(clampedPageType, backgroundScaleFactor);
		this.scaleContentContainer(defaultLayoutScaleFactor);
		if (!this.image.hidden)
			this.scaleImage(page.type, customLayoutScaleFactor);

		const ornamentHeight = 12;
		const textMargin = 6 * defaultLayoutScaleFactor;
		this.loadDefaultLayout(defaultLayoutScaleFactor, !!page.title);
		this.applyCustomLayout(page.titleSize, page.textSize, ornamentHeight + textMargin, customLayoutScaleFactor);
		this.scaleTextFieldToText();
		this.updateOrnaments(ornamentHeight, textMargin);
	}

	setBackground(pageType, scaleFactor)
	{
		this.background.size = this.scaleSizeBy(this.backgroundSizes[pageType], scaleFactor);
		this.background.sprite = "stretched:" + this.BackgroundTextures[pageType];
		this.underlay.size = this.scaleSizeBy(this.underlaySizes[pageType], scaleFactor);
		this.underlay.sprite = "stretched:" + this.UnderlayTextures[pageType];
		this.pageContainer.size = this.scaleSizeBy(this.pageContainerSizes[pageType], scaleFactor);
	}

	scaleContentContainer(scaleFactor)
	{
		const sidePadding = 40 * scaleFactor;
		const topPadding = 30 * scaleFactor;
		this.contentContainer.size = {
			"rleft": 0, "left": sidePadding,
			"rright": 100, "right": -sidePadding,
			"rtop": 0, "top": topPadding,
			"rbottom": 100, "bottom": this.buttonContainer.size.top
		};
	}

	scaleImage(pageType, scaleFactor)
	{
		this.image.size = this.scaleSizeBy(this.backgroundSizes[pageType], scaleFactor);
	}

	loadDefaultLayout(scaleFactor, hasTitle)
	{
		const titleContainerHeight = 35 * scaleFactor;
		const horizontalTextMargin = 15;
		this.title.size = {
			"rleft": 0, "left": 0,
			"rright": 100, "right": 0,
			"rtop": 0, "top": 0,
			// Even if there's no title, leave some additional free space above the text, that just looks more natural.
			"rbottom": 0, "bottom": (hasTitle ? titleContainerHeight : titleContainerHeight / 2.5)
		};
		this.text.size = {
			"rleft": 0, "left": 0,
			"rright": 100, "right": 0,
			"rtop": 0, "top": this.title.size.bottom + horizontalTextMargin,
			"rbottom": 100, "bottom": -horizontalTextMargin
		};
	}

	applyCustomLayout(titleSize, textSize, ornamentSpace, scaleFactor)
	{
		if (titleSize)
		{
			// titleSize is a string, but scaleSizeBy requires an object.
			// We can make the engine parse the string by simply assigning it.
			this.title.size = titleSize;
			this.title.size = this.scaleSizeBy(this.title.size, scaleFactor);
		}

		if (textSize)
		{
			// textSize is a string, but scaleSizeBy requires an object.
			// We can make the engine parse the string by simply assigning it.
			this.text.size = textSize;

			// We count the ornaments as part of the text field.
			// Technically, that's not the case, of course, but that's how it looks from the outside.
			// In combination with an image, it also makes scaling more intuitively predictable.
			this.text.size.top += ornamentSpace;
			this.text.size.bottom -= ornamentSpace;

			this.text.size = this.scaleSizeBy(this.text.size, scaleFactor);
		}
	}

	/**
	 * Scale the text field (horizontally as well as vertically) down to the actual text size.
	 * And while doing so try to maintain the original aspect ratio of the text field as well as possible.
	 * Essentially, calculate "how wide does it have to be, so that: width / predicted displayed text height = certain aspect ratio"
	 * This is done by modelling the text drawing behaviour of the engine with a simple formula.
	 * It isn't perfect by any means and could be viewed as overkill, but in practice is actually a decent improvement most layouts.
	 */
	scaleTextFieldToText()
	{
		const textContainerSize = this.text.getComputedSize();
		const currentWidth = textContainerSize.right - textContainerSize.left;
		const currentHeight = textContainerSize.bottom - textContainerSize.top;
		const minWidth = currentWidth * 0.7;
		const aspectRatio = currentWidth / currentHeight;

		// For the calculation, we need the full string's displayed length and the height of a single line.
		// .getPreferredSize() doesn't return those if the string contains line breaks (and rightfully so, I guess).
		const actualCaption = this.text.caption;
		const numberOfParagraphs = this.text.caption.split("\n").length;
		const extraSpacePerParagraph = currentWidth * 0.4;
		this.text.caption = this.text.caption.replaceAll("\n", "");
		const captionSize = this.text.getPreferredTextSize();
		const spaceBetweenLines = 3;

		// Arbitrary value used to account for word-wrapping (as much as possible).
		const averageWordLength = 40;

		// Now that we've got all the ingredients, let's toss them all into a pot, mix them, cast the spell, and hope the witchcraft classes finally pay off.
		const calculatedWidth = Math.sqrt(aspectRatio * (captionSize.height + spaceBetweenLines) * (captionSize.width + extraSpacePerParagraph * numberOfParagraphs) * (1 + averageWordLength / minWidth));
		const calculatedWidthClamped = Math.min(currentWidth, Math.max(minWidth, calculatedWidth));
		const halfWidthDifference = (currentWidth - calculatedWidthClamped) / 2;
		this.text.size.left += halfWidthDifference;
		this.text.size.right -= halfWidthDifference - 15;

		// Should not be necessary. #8200
		this.text.getComputedSize();

		this.text.caption = actualCaption;

		const heightClamped = Math.min(currentHeight, this.text.getTextSize().height);
		const halfHeightDifference = (currentHeight - heightClamped) / 2;
		this.text.size.top += halfHeightDifference;
		this.text.size.bottom -= halfHeightDifference;
	}

	updateOrnaments(ornamentHeight, textMargin)
	{
		// Should not be necessary. #8200
		this.text.getComputedSize();

		// The only reason the size is set here and not just in the XML is to achieve the minimum ornament width.
		// Especially on the small page type this makes a big difference.

		const minOrnamentWidth = 320;
		const ornamentWidthDecrement = -100;
		const ornamentWidth = Math.max(this.text.getTextSize().width + ornamentWidthDecrement, minOrnamentWidth);

		this.topOrnament.size = {
			"rleft": 50, "left": -ornamentWidth / 2,
			"rright": 50, "right": ornamentWidth / 2,
			"rtop": 0, "top": -textMargin - ornamentHeight,
			"rbottom": 0, "bottom": -textMargin
		};

		this.bottomOrnament.size = {
			"rleft": 50, "left": -ornamentWidth / 2,
			"rright": 50, "right": ornamentWidth / 2,
			"rtop": 100, "top": textMargin,
			"rbottom": 100, "bottom": textMargin + ornamentHeight
		};
	}


	updateButtons()
	{
		const hasNextPageToShow = this.currentPageIndex < this.pages.length - 1;
		this.nextButton.caption = hasNextPageToShow ? this.NextButtonCaption : this.CloseButtonCaption;
		this.nextButton.tooltip = hasNextPageToShow ? this.NextButtonTooltip : this.CloseButtonTooltip;
		this.previousButton.enabled = this.currentPageIndex > 0;
	}
}


NarrativeOverlay.prototype.CloseButtonCaption = translateWithContext("button caption", "Close");
NarrativeOverlay.prototype.CloseButtonTooltip = translateWithContext("button tooltip", "Close the narrative.");
NarrativeOverlay.prototype.NextButtonCaption = translateWithContext("button caption", "Next");
NarrativeOverlay.prototype.NextButtonTooltip = translateWithContext("button tooltip", "Switch to the next page.");
NarrativeOverlay.prototype.PreviousButtonCaption = translateWithContext("button caption", "Previous");
NarrativeOverlay.prototype.PreviousButtonTooltip = translateWithContext("button tooltip", "Switch to the previos page.");

/**
 * The different types (i.e. sizes) of narrative pages.
 */
NarrativeOverlay.prototype.PAGE_TYPE = Object.freeze({
	"SMALL": 0,
	"MEDIUM": 1,
	"LARGE": 2
});

/**
 * The factor by which various margins are scaled on each page type.
 * These values are interpolated when scaling along the screen resolution.
 */
NarrativeOverlay.prototype.DefaultLayoutScaleFactor = {
	[NarrativeOverlay.prototype.PAGE_TYPE.SMALL]: 1,
	[NarrativeOverlay.prototype.PAGE_TYPE.MEDIUM]: 1.35,
	[NarrativeOverlay.prototype.PAGE_TYPE.LARGE]: 1.8
};

/**
 * The parchment textures to place in the background for each page type.
 */
NarrativeOverlay.prototype.BackgroundTextures = {
	[NarrativeOverlay.prototype.PAGE_TYPE.SMALL]: "session/narrative_overlay/parchment_small.png",
	[NarrativeOverlay.prototype.PAGE_TYPE.MEDIUM]: "session/narrative_overlay/parchment_medium.png",
	[NarrativeOverlay.prototype.PAGE_TYPE.LARGE]: "session/narrative_overlay/parchment_large.png"
};

/**
 * The "glow" textures to place behind the parchment for each page type.
 */
NarrativeOverlay.prototype.UnderlayTextures = {
	[NarrativeOverlay.prototype.PAGE_TYPE.SMALL]: "session/narrative_overlay/parchment_small_underlay.png",
	[NarrativeOverlay.prototype.PAGE_TYPE.MEDIUM]: "session/narrative_overlay/parchment_medium_underlay.png",
	[NarrativeOverlay.prototype.PAGE_TYPE.LARGE]: "session/narrative_overlay/parchment_large_underlay.png"
};

/**
 * The dimensions of the image files specified in NarrativeOverlay.protoype.BackgroundTextures
 */
NarrativeOverlay.prototype.BackgroundTextureDimensions = {
	[NarrativeOverlay.prototype.PAGE_TYPE.SMALL]: {
		"width": 1024,
		"height": 512
	},
	[NarrativeOverlay.prototype.PAGE_TYPE.MEDIUM]: {
		"width": 1024,
		"height": 512
	},
	[NarrativeOverlay.prototype.PAGE_TYPE.LARGE]: {
		"width": 2048,
		"height": 1024
	}
};

/**
 * The dimensions of the image files specified in NarrativeOverlay.protoype.UnderlayTextures
 */
NarrativeOverlay.prototype.UnderlayTextureDimensions = {
	[NarrativeOverlay.prototype.PAGE_TYPE.SMALL]: {
		"width": 1024,
		"height": 1024
	},
	[NarrativeOverlay.prototype.PAGE_TYPE.MEDIUM]: {
		"width": 2048,
		"height": 1024
	},
	[NarrativeOverlay.prototype.PAGE_TYPE.LARGE]: {
		"width": 2048,
		"height": 2048
	}
};

/**
 * Roughly the space that the actual parchment occupies on the images specified in NarrativeOverlay.prototype.BackgroundTextures
 * This is a lot less than the image files' actual dimensions because those have to be powers of two.
 */
NarrativeOverlay.prototype.PageDimensions = {
	[NarrativeOverlay.prototype.PAGE_TYPE.SMALL]: {
		"width": 492,
		"height": 282
	},
	[NarrativeOverlay.prototype.PAGE_TYPE.MEDIUM]: {
		"width": 853,
		"height": 470
	},
	[NarrativeOverlay.prototype.PAGE_TYPE.LARGE]: {
		"width": 1140,
		"height": 657
	}
};
