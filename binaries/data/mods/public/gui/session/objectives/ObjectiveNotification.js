const OBJECTIVE_STATE_ACTIVE = 0;
const OBJECTIVE_STATE_COMPLETED = 1;
const OBJECTIVE_STATE_CANCELLED = 2;
const OBJECTIVE_STATE_FAILED = 3;

/**
 * This class displays objective notications recieved from the simulation.
 * They are laid over the game without pausing it and aren't closed when dialogs are opened above them.
 * If a notification is received while another one is shown already, it is added to a queue.
 * The class sends responses to the simulation when a notification is closed and/or a new one loaded in from the queue.
 * => Interactions with the close button affect the simulation; that has to be communicated to the player.
 */
class ObjectiveNotification
{
    constructor(overviewPanel, pauseControl)
    {
        this.overviewPanel = overviewPanel;

        this.dialog = Engine.GetGUIObjectByName("objectiveNotitfication");
        this.background = Engine.GetGUIObjectByName("objectiveNotificationBackground");
        this.header = Engine.GetGUIObjectByName("objectiveNotitficationHeader");
        this.detailContainer = Engine.GetGUIObjectByName("objectiveNotificationDetails");
        this.title = Engine.GetGUIObjectByName("objectiveNotitficationTitle");
        this.textContainer = Engine.GetGUIObjectByName("objectiveNotitficationTextContainer");
        this.infoText = Engine.GetGUIObjectByName("objectiveNotitficationInfoText");
        this.labelText = Engine.GetGUIObjectByName("objectiveNotitficationLabelText");
        this.topSeparator = Engine.GetGUIObjectByName("objectiveNotitficationTopSeparator");
        this.bottomSeparator = Engine.GetGUIObjectByName("objectiveNotificationBottomSeparator");
        this.closeHint = Engine.GetGUIObjectByName("objectiveNotificationCloseHint");
        this.closeButton = Engine.GetGUIObjectByName("objectiveNotitficationCloseButton");
        this.closeButton.onPress = this.loadNextNotificationFromQueue.bind(this);

        this.queue = [];
        this.lastChangedTime = Date.now();
        // Don't play the sound at he very beginning of the game; the music abpruptly started along with the ambient noise.
        // The player wouldn't be able to make out the notification sound in that.
        this.shouldPlaySound = false;
        this.displayedNotification = {};
        // "Urgent" notifications are ones that players mustn't be able to postpone in any way.
        // (For example, by not closing preceding notifications or reopening notifications from the objective overview)
        // Whilever this is true, the queue is automatically polled in intervals of this.MinDuration until all urgent notifications have been shown.
        this.containsQueueUrgentNotifications = false;
        this.isGamePaused = false;
        this.dialog.hidden = true;
        // Used to dampen the effect of width scaling.
        this.idealDialogWidth = this.dialog.size.right - this.dialog.size.left;

        this.dialog.onWindowResized = this.scaleGuiElementsToFit.bind(this);
        this.dialog.onTick = this.onTick.bind(this);

        pauseControl.registerPauseHandler((() => { this.isGamePaused = !this.isGamePaused; }));
        this.overviewPanel.setNotificationDialog(this);
    }

    handleNewNotification(notification)
    {
        if (this.dialog.hidden || this.displayedNotification.isReread)
            this.displayNotification(notification);
        else
        {
            this.addNotificationToQueue(notification);
            if (this.displayedNotification.objectiveID === notification.objectiveID)
                // The notification has been added to the beginning.
                this.loadNextNotificationFromQueue();
            return;
        }
    }

    addNotificationToQueue(notification)
    {
        const [index, lastData] = [this.displayedNotification, ...this.queue].reduce((ret, item, idx) => item.objectiveID == notification.objectiveID ? [idx, item] : ret, [-1, null]);

        const relatedNotificationFound = index != -1;
        const firstNonUrgentIndex = this.queue.findIndex(item => !item.isUrgent);
        // Considering that we should only receive a maximum of two notifications per objective, if the first one hasn't been shown (or not long enough yet),
        // the player does not yet know about the objective at all => the second (current) one should be labelled as "new" (if the first one was, at least).
        if (relatedNotificationFound && (index !== 0 || Date.now() < this.lastChangedTime + this.MinDuration))
            notification.isNewObjective = lastData.isNewObjective;

        if (index === 0)
            // The notification should loaded in right afterwards in this case.
            this.queue.unshift(notification);
        else if (relatedNotificationFound && (!notification.isUrgent || index < firstNonUrgentIndex))
            this.queue[index - 1] = notification;
        else if (notification.isUrgent)
        {
            this.queue.splice(firstNonUrgentIndex, 0, notification)
            if (relatedNotificationFound)
                this.queue.splice(index, 1);
        }
        else
            this.queue.push(notification);

        this.containsQueueUrgentNotifications = this.containsQueueUrgentNotifications || !!notification.isUrgent;
        // TODO: Maybe don't update them in the case that the queue didn't previously contain an urgent notification, but one was just added and is about to be loaded in anyway?
        this.updateCloseCaptions(this.displayedNotification.closeButtonCaption, this.displayedNotification.state, this.displayedNotification.onlyResolveWhenClosing);
    }

    loadNextNotificationFromQueue()
    {
        this.closeDisplayedNotification();
        if (this.queue.length === 0)
        {
            this.dialog.hidden = true;
            this.displayedNotification = {};
        }
        else
        {
            this.displayNotification(this.queue.shift());
            this.containsQueueUrgentNotifications = this.queue.some(notification => !!notification.isUrgent);
        }
    }

    hasQueueUrgentNotifications()
    {
        return this.containsQueueUrgentNotifications;
    }

    displayNotification(notification)
    {
        // If both are present, only show the one that actually takes effect, since, in most cases, that's what's actually relevant.
        // Also, displaying both could be redundant, e.g. "Reward: Victory" and "Avoided Consequence: Defeat"
        if ("reward" in notification.message && "consequence" in notification.message)
            if (notification.state === OBJECTIVE_STATE_COMPLETED)
                delete notification.message.consequence;
            else if (notification.state === OBJECTIVE_STATE_FAILED)
                delete notification.message.reward;

        this.displayedNotification = notification;
        this.rebuildHeader(notification.state, notification.isNewObjective, notification.isMainObjective);

        this.background.sprite = "color:" + rgbToGuiColor(this.BackgroundColors[notification.state], this.BackgroundOpacities.base)
        this.detailContainer.sprite = "color:" + rgbToGuiColor(this.BackgroundColors[notification.state], this.BackgroundOpacities.overlay);

        this.title.caption = translate(notification.title);

        // This is necessary for determining the caption width in setTextCaptions. (But it really shouldn't be. Check that method for an explanation.)
        // The size is later overwritten in scaleGuiElementsToFit anyway.
        const dialogSize = this.dialog.size;
        const labelTextSize = this.labelText.size;
        dialogSize.left = -this.idealDialogWidth / 2;
        dialogSize.right = +this.idealDialogWidth / 2;
        labelTextSize.left = 0;
        labelTextSize.right = 0;
        this.dialog.size = dialogSize;
        this.labelText.size = labelTextSize;

        this.setTextCaptions(notification.message, notification.state);
        this.updateCloseCaptions(notification.closeButtonCaption, notification.state, notification.onlyResolveWhenClosing);
        this.scaleGuiElementsToFit();

        this.hasObjectiveBeenShownLongEnough = false;
        this.dialog.hidden = false;
        this.lastChangedTime = Date.now();

        if (notification.isReread)
            return;

        this.overviewPanel.handleNotification(notification);
        if (this.shouldPlaySound)
            Engine.GuiInterfaceCall("PlaySoundForPlayer", { "name": "objective" });

        if (!notification.onlyResolveWhenClosing)
            Engine.PostNetworkCommand({
                "type": "objective-notification-resolved",
                "objectiveID": this.displayedNotification.objectiveID
            });

    }

    rebuildHeader(state, isNewObjective, isMainObjective)
    {
        switch (state)
        {
            // Objectives already failed or completed before adding them have to be added by simply pushing two notifications (adding and then completing/failing them) directly after each other.
            // In that case, we want the title to be "New ..." to prevent players from thinking it was added some time ago and they missed it.
            // TODO: The small title change might not be enough. Maybe there should be a note somewhere too.

            case OBJECTIVE_STATE_ACTIVE:
                // Objectives added right at the start of the game (the victory conditions) aren't treated as "new" objectives.
                this.header.caption = isNewObjective ?
                    isMainObjective ?
                        this.HeaderCaptions.newMainObjective :
                        this.HeaderCaptions.newSideObjective :
                    isMainObjective ?
                        this.HeaderCaptions.mainObjective :
                        this.HeaderCaptions.sideObjective;
                break;

            case OBJECTIVE_STATE_COMPLETED:
                this.header.caption = isNewObjective ?
                    isMainObjective ?
                        this.HeaderCaptions.newMainObjectiveCompleted :
                        this.HeaderCaptions.newSideObjectiveCompleted :
                    isMainObjective ?
                        this.HeaderCaptions.mainObjectiveCompleted :
                        this.HeaderCaptions.sideObjectiveCompleted;
                break;

            case OBJECTIVE_STATE_FAILED:
                this.header.caption = isNewObjective ?
                    isMainObjective ?
                        this.HeaderCaptions.newMainObjectiveFailed :
                        this.HeaderCaptions.newSideObjectiveFailed :
                    isMainObjective ?
                        this.HeaderCaptions.mainObjectiveFailed :
                        this.HeaderCaptions.sideObjectiveFailed;
                break;

            case OBJECTIVE_STATE_CANCELLED:
                this.header.caption = isNewObjective ?
                    isMainObjective ?
                        this.HeaderCaptions.newMainObjectiveCancelled :
                        this.HeaderCaptions.newSideObjectiveCancelled :
                    isMainObjective ?
                        this.HeaderCaptions.mainObjectiveCancelled :
                        this.HeaderCaptions.sideObjectiveCancelled;
                break;

            default: error("Invalid objective state specified: " + state);
        }

        this.header.textcolor = rgbToGuiColor(this.HeaderColors[state]);
    }

    setTextCaptions(message, state)
    {
        this.infoText.caption = message.info || "";

        this.labelText.caption = "";
        let currentLineWidth = 0;
        const maxWidth = this.idealDialogWidth - this.textContainer.size.left + this.textContainer.size.right - this.detailContainer.size.left + this.detailContainer.size.right - this.labelText.buffer_zone;
        // The texts can get pretty short (e.g. "Reward: 50 [woodIcon]"). Try to arrange them next to each other on these cases.
        const addToLabelTextCaption = (label, text) => {
            const newCaption = setStringTags(label, this.LabelTags) + " " + text;

            // TODO: Unfortunately, we cannot just pass newCaption to Engine.GetTextWidth here as that function doesn't work with string tags.
            // Doing this instead is quite awkward and shouldn't be necessary. Issue: #7712
            const previousCaption = this.labelText.caption;
            this.labelText.caption = newCaption;
            const newCaptionWidth = this.labelText.getTextSize().width;
            this.labelText.caption = previousCaption;

            // Don't add the spaces to the very beginning.
            const freeSpace = currentLineWidth == 0 ? "" : "    ";
            if (currentLineWidth && currentLineWidth + newCaptionWidth > maxWidth)
            {
                this.labelText.caption += "\n\n" + newCaption;
                currentLineWidth = newCaptionWidth;
            }
            else
            {
                this.labelText.caption += freeSpace + newCaption;
                currentLineWidth += newCaptionWidth;
            }
        }


        for (const [key, list] of Object.entries(this.Labels))
            if (key in message)
                for (const item of list)
                    if (item.states.includes(state))
                    {
                        addToLabelTextCaption(item.caption, message[key]);
                        break;
                    }
    }

    updateCloseCaptions(customCloseButtonCaption, state, onlyResolveWhenClosing)
    {
        const key =
            onlyResolveWhenClosing ?
                state == OBJECTIVE_STATE_ACTIVE ?
                    "start" :
                    "continue" :
                this.queue.length ?
                    "next":
                    "close";

        this.closeHint.caption = this.CloseCaptions[key].hint || "";
        this.closeButton.caption = customCloseButtonCaption || this.CloseCaptions[key].button;
        this.closeButton.tooltip = this.CloseCaptions[key].tooltip || "";
    }

    /**
     * Adapt the different text fields to the newly set captions to improve its visual appeal.
     * This helps because the text can differ quite a lot in length depending on how much there is to say about the objective.
     * Essentially, the goal is to shrink the dialog down to what's needed to comfortable display the current text.
     */
    scaleGuiElementsToFit()
    {
        const infoTextSize = this.infoText.size;
        const labelTextSize = this.labelText.size;
        const dialogSize = this.dialog.size;

        const heightBuffer = 15;

        const titleCaptionWidth = this.title.getTextSize().width;
        const infoTextCaptionSize = this.infoText.getTextSize();
        const labelTextCaptionSize = this.labelText.getTextSize();

        const isInfoTextCaptionEmpty = this.infoText.caption == "";
        const isLabelTextCaptionEmpty = this.labelText.caption == "";
        const infoTextHeight = isInfoTextCaptionEmpty ? 0 : infoTextCaptionSize.height;
        const labelTextHeight = isLabelTextCaptionEmpty ? 0 : labelTextCaptionSize.height;

        if (isLabelTextCaptionEmpty)
        {
            infoTextSize.rbottom = 100;
            infoTextSize.bottom = 0;
        }
        else
        {
            infoTextSize.rbottom = 0;
            // If some of the height buffer is not added here, the label text "gets" it all (its size.rbottom is 100 and its text_valign is "center")
            infoTextSize.bottom = isInfoTextCaptionEmpty ? 0 : infoTextHeight + heightBuffer / 2;
        }
        labelTextSize.top = infoTextSize.bottom;
        this.infoText.size = infoTextSize;

        const newTextContainerWidth = Math.max(titleCaptionWidth, Math.max(labelTextCaptionSize.width, infoTextCaptionSize.width));
        const totalWidth = newTextContainerWidth + this.textContainer.size.left - this.textContainer.size.right + this.detailContainer.size.left - this.detailContainer.size.right;
        const dialogWidthDifference = this.idealDialogWidth - totalWidth;
        // Squeezing the dialog width right to any texts' width looks weird for very small values => the effect is weakened by multiplying a certain factor
        const dialogWidthScalingFactor = .7;
        const newDialogWidth = this.idealDialogWidth - dialogWidthDifference * dialogWidthScalingFactor;

        dialogSize.left = -newDialogWidth / 2;
        dialogSize.right = newDialogWidth / 2;
        // The size has to be applied now since the text container (a few lines down) depends on it.
        this.dialog.size = dialogSize;

        // We want the separator to be significantly wider than the title.
        const halfSeparatorWidth = Math.min(newDialogWidth / 2, titleCaptionWidth / 2 + 50);
        let topSeparatorSize = this.topSeparator.size;
        let bottomSeparatorSize = this.bottomSeparator.size;
        topSeparatorSize.left = -halfSeparatorWidth;
        bottomSeparatorSize.left = -halfSeparatorWidth;
        topSeparatorSize.right = halfSeparatorWidth;
        bottomSeparatorSize.right = halfSeparatorWidth;
        this.topSeparator.size = topSeparatorSize;
        this.bottomSeparator.size = bottomSeparatorSize;

        const textContainerSize = this.textContainer.getComputedSize();
        const textContainerWidth = textContainerSize.right - textContainerSize.left;

        // The label text is aligned to the left.
        // This section here adds some artificial indentation (cropping the object) if the text is so short it would look weird otherwise.
        if (!isLabelTextCaptionEmpty)
        {
            const labelTextPadding = (textContainerWidth - labelTextCaptionSize.width) / 2;
            labelTextSize.left = labelTextPadding;
            labelTextSize.right = -labelTextPadding;
        }
        else
        {
            labelTextSize.left = 0;
            labelTextSize.right = 0;
        }
        this.labelText.size = labelTextSize;

        dialogSize.bottom =
            this.labelText.getComputedSize().top +
            (isLabelTextCaptionEmpty ? infoTextHeight : labelTextHeight) +
            (isInfoTextCaptionEmpty ? heightBuffer : heightBuffer / 2) -
            this.textContainer.size.bottom -
            this.detailContainer.size.bottom;
        this.dialog.size = dialogSize;
    }

    onTick()
    {
        if (this.isGamePaused)
            return;

        if (Date.now() > this.lastChangedTime + this.MinDuration)
        {
            this.shouldPlaySound = true;
            if (this.containsQueueUrgentNotifications)
                this.loadNextNotificationFromQueue();
        }
    }

    getDisplayedNotification()
    {
        return this.displayedNotification;
    }

    closeDisplayedNotification()
    {
        if (!this.displayedNotification.isReread && this.displayedNotification.onlyResolveWhenClosing)
            Engine.PostNetworkCommand({
                "type": "objective-notification-resolved",
                "objectiveID": this.displayedNotification.objectiveID
            });
    }
}

ObjectiveNotification.prototype.HeaderCaptions = {
    "mainObjective": translate("Main Objective"),
    "newMainObjective": translate("New Main Objective"),

    "mainObjectiveCompleted": translate("Main Objective Completed"),
    "newMainObjectiveCompleted": translate("New Main Objective Completed"),

    "mainObjectiveFailed": translate("Main Objective Failed"),
    "newMainObjectiveFailed": translate("New Main Objective Failed"),

    "mainObjectiveCancelled": translate("Main Objective Cancelled"),
    "newMainObjectiveCancelled": translate("New Main Objective"),


    "sideObjective": translate("Side Objective"),
    "newSideObjective": translate("New Side Objective"),

    "sideObjectiveCompleted": translate("Side Objective Completed"),
    "newSideObjectiveCompleted": translate("New Side Objective Completed"),

    "sideObjectiveFailed": translate("Side Objective Failed"),
    "newSideObjectiveFailed": translate("New Side Objective Failed"),

    "sideObjectiveCancelled": translate("Side Objective Cancelled"),
    "newSideObjectiveCancelled": translate("New Side Objective Cancelled")
};

/**
 * The minimum time all notifications have to be shown before being automatically overwritten when the queue contains an urgent notification.
 */
ObjectiveNotification.prototype.MinDuration = 5000;

ObjectiveNotification.prototype.HeaderColors = {
    [OBJECTIVE_STATE_ACTIVE]: { "r": 196, "g": 159, "b": 108 },
    [OBJECTIVE_STATE_COMPLETED]: { "r": 119, "g": 186, "b": 52 },
    [OBJECTIVE_STATE_FAILED]: { "r": 230, "g": 77, "b": 57 },
    [OBJECTIVE_STATE_CANCELLED]: { "r": 186, "g": 177, "b": 50 }
};

ObjectiveNotification.prototype.BackgroundColors = {
    [OBJECTIVE_STATE_ACTIVE]: { "r": 12, "g": 12, "b": 12 },
    [OBJECTIVE_STATE_COMPLETED]: { "r": 4, "g": 31, "b": 0 },
    [OBJECTIVE_STATE_FAILED]: { "r": 50, "g": 4, "b": 0 },
    [OBJECTIVE_STATE_CANCELLED]: { "r": 29, "g": 28, "b": 1 }
};

ObjectiveNotification.prototype.BackgroundOpacities = {
    "base": 200,
    "overlay": 140
};

ObjectiveNotification.prototype.Labels = {
    "task": [
        {
            "states": [OBJECTIVE_STATE_ACTIVE],
            "caption": translateWithContext("Label on objective notifications", "Task:"),
        }
    ],
    "reward": [
        {
            "states": [OBJECTIVE_STATE_ACTIVE, OBJECTIVE_STATE_COMPLETED],
            "caption": translateWithContext("Label on objective notifications", "Reward:")
        },
        {
            "states": [OBJECTIVE_STATE_FAILED, OBJECTIVE_STATE_CANCELLED],
            "caption": translateWithContext("Label on objective notifications", "Missed Reward:")
        }
    ],
    "consequence": [
        {
            "states": [OBJECTIVE_STATE_ACTIVE],
            "caption": translateWithContext("Label on objective notifications", "Consequence If Failed:")
        },
        {
            "states": [OBJECTIVE_STATE_FAILED],
            "caption": translateWithContext("Label on objective notifications", "Consequence:")
        },
        {
            "states": [OBJECTIVE_STATE_COMPLETED, OBJECTIVE_STATE_CANCELLED],
            "caption": translateWithContext("Label on objective notifications", "Avoided Consequence:")
        }
    ]
};

ObjectiveNotification.prototype.LabelTags = { "font": "sans-bold-14" };

ObjectiveNotification.prototype.CloseCaptions =
{
    "close": {
        "hint": translate("Click to close."),
        "button": translateWithContext("button", "Close"),
        "tooltip": translate("Close this notification.")
    },
    "next": {
        "hint": translate("Click to view the next notification."),
        "button": translateWithContext("button", "Next"),
        "tooltip": translate("Close this dialog.")
    },
    "start": {
        "hint": translate("Click to start this objective."),
        "button": translateWithContext("button", "Start"),
        "tooltip": translate("Start this objective.")
    },
    "continue": {
        "hint": translate("Click to continue."),
        "button": translateWithContext("button", "Continue")
    },

};
