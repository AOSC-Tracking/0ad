/**
 * This class provides an overview about active and past objectives to the player.
 * Clicking on one lets the player open its last notification again (i.e. viewing it in its current state).
 */
class ObjectiveOverview
{
    constructor()
    {
        this.panel = Engine.GetGUIObjectByName("objectiveOverview");
        this.header = Engine.GetGUIObjectByName("objectiveOverviewHeader");
        this.background = Engine.GetGUIObjectByName("objectiveOverviewBackground");
        this.objectiveButtonList = Engine.GetGUIObjectByName("objectiveOverviewEntries");
        this.objectiveButtons = this.objectiveButtonList.children;
        this.objectiveStateLabels = this.objectiveButtons.map(obj => obj.children[0]);

        this.objectives = [];
        this.buttonHeight = this.header.size.bottom - this.header.size.top;;
        this.header.caption = this.headerCaption;
        this.header.onPress = this.toggle.bind(this);

        this.initButtons();
    }

    setNotificationDialog(notificationDialog)
    {
        this.notificationDialog = notificationDialog;
    }

    toggle()
    {
        this.objectiveButtonList.hidden = !this.objectiveButtonList.hidden;
        this.updateBackgroundHeight();
        if (this.objectiveButtonList.hidden)
            this.setPanelWidth(this.MinPanelWidth);
        else
            this.rebuildButtons();
    }

    initButtons()
    {
        for (let [index, button] of this.objectiveButtons.entries())
        {
            button.size = new GUISize(button.size.left, index * this.buttonHeight, 0, (index + 1) * this.buttonHeight, 0, 0, 100, 0);
            button.onPress = (() => { this.showObjectiveDetails(index); }).bind(this);
            button.hidden = true;
        }
    }

    rebuildButtons()
    {
        let largestButtonWidth = 0;
        for (let i in this.objectives)
        {
            const objective = this.objectives[i];
            const button = this.objectiveButtons[i];
            const label = this.objectiveStateLabels[i];
            label.caption = coloredText(this.stateCaptions[objective.state].label, this.stateCaptions[objective.state].labelColor);
            button.caption = coloredText(this.objectives[i].title, this.stateCaptions[objective.state].textColor);
            button.hidden = false;

            largestButtonWidth = Math.max(
                largestButtonWidth,
                Engine.GetTextWidth(button.font, this.objectives[i].title) +
                Engine.GetTextWidth(label.font, this.stateCaptions[objective.state].label) +
                button.buffer_zone + label.buffer_zone + this.MinTitleToLabelDistance
            );
        }

        const largestButtonWidthClamped = Math.min(Math.max(this.MinPanelWidth, largestButtonWidth), this.MaxPanelWidth);
        this.setPanelWidth(largestButtonWidthClamped + this.objectiveButtonList.size.left - this.objectiveButtonList.size.right);
    }

    setPanelWidth(width)
    {
        const panelSize = this.panel.size;
        panelSize.right = panelSize.left + width;
        this.panel.size = panelSize;
    }

    updateBackgroundHeight()
    {
        const backgroundSize = this.background.size;
        backgroundSize.bottom = this.objectiveButtonList.hidden ? this.buttonHeight : this.buttonHeight * (this.objectives.length + 1);
        backgroundSize.rbottom = 0;
        this.background.size = backgroundSize;
    }

    handleNotification(notification)
    {
        // Overwrite these flags to ensure the player understands when displayed again that it is not a new notification sent by the simulation.
        const objective = { ...notification, "isUrgent": false, "isNewObjective": false, "isReread": true };

        // Delete any existing entry of that objective.
        // (In practive, that should only ever be an active one.)
        if (objective.state !== OBJECTIVE_STATE_ACTIVE)
        {
            const index = this.objectives.findIndex(el => el.objectiveID === notification.objectiveID);
            if (index != -1)
                this.objectives.splice(index, 1);
        }

        const stateOrderIndex = this.stateOrder.indexOf(objective.state);

        // Primary sorting: by the defined state order (ascending) -- the active ones first.
        // Secondary sorting: by age (descending) -- the oldest ones first.
        const insertIndex = this.objectives.findIndex(obj => this.stateOrder.indexOf(obj.state) > stateOrderIndex);
        if (insertIndex == -1)
        {
            if (this.objectives.length < this.objectiveButtons.length - 1)
                this.objectives.push(objective);
            else
                warn("ObjectiveOverview: Can't display " + this.objectives.length + " objectives with only " + this.objectiveButtons.length + " buttons provided.");
        }
        else
            this.objectives.splice(insertIndex, 0, objective);

        this.rebuildButtons();
        this.updateBackgroundHeight();
    }

    showObjectiveDetails(index)
    {
        const notification = this.objectives[index];
        const displayedNotification = this.notificationDialog.getDisplayedNotification();
        const isAlreadyDisplayed = notification.objectiveID == displayedNotification.objectiveID && notification.state == displayedNotification.state;
        // When the notification dialog receives an "urgent" notification, it starts loading in all notifications before that automatically in certain time intervals.
        // This is done to show the urgent one as fast as possible and prevent the player from stalling a scripted scenario game in a favorable way.
        // This is quite an edge case, but while it is happening we obviously can't push a notification to it, or else we'd give the player an opportunity to do exactly that.
        // TODO: Let the player know in some way why they can't view objectives from here.
        if (!this.notificationDialog.hasQueueUrgentNotifications() && !isAlreadyDisplayed)
        {
            this.notificationDialog.closeDisplayedNotification();
            this.notificationDialog.displayNotification(notification);
        }
    }
}

ObjectiveOverview.prototype.headerCaption = translate("Objectives");

ObjectiveOverview.prototype.stateCaptions =
{
    [OBJECTIVE_STATE_ACTIVE]: {
        "label": translateWithContext("objective state label", "Active"),
        "textColor": "white",
        "labelColor": "246 221 176"
    },
    [OBJECTIVE_STATE_COMPLETED]: {
        "label": translateWithContext("objective state label", "Completed"),
        "textColor": "180 180 180",
        "labelColor": "115 185 49"
    },
    [OBJECTIVE_STATE_CANCELLED]: {
        "label": translateWithContext("objective state label", "Cancelled"),
        "textColor": "180 180 180",
        "labelColor": "191 182 50"
    },
    [OBJECTIVE_STATE_FAILED]: {
        "label": translateWithContext("objective state label", "Failed"),
        "textColor": "180 180 180",
        "labelColor": "255 93 71"
    },
};

/**
 * How to primarily sort the objectives (from top to bottom).
 */
ObjectiveOverview.prototype.stateOrder = [OBJECTIVE_STATE_ACTIVE, OBJECTIVE_STATE_COMPLETED, OBJECTIVE_STATE_FAILED, OBJECTIVE_STATE_CANCELLED];

ObjectiveOverview.prototype.MinPanelWidth = 200;
ObjectiveOverview.prototype.MaxPanelWidth = 350;

/**
 * The minimum horizontal distance between the objective titles and their labels (in pixels).
 */
ObjectiveOverview.prototype.MinTitleToLabelDistance = 20;
