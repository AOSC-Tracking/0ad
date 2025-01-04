function Upgrade()
{
	/** @type {number} */
	this.entity;
	/** @type {Template} */
	this.template;

	/** @type {Record<string, any>} */
	this.upgradeTemplates;
	/** @type {Record<string, number>} */
	this.expendedResources;

	/** @type {string | undefined} */
	this.upgrading;

	/** @type {number} */
	this.owner;
};

const UPGRADING_PROGRESS_INTERVAL = 250;

Upgrade.prototype.Schema =
	"<oneOrMore>" +
		"<element>" +
			"<anyName />" +
			"<interleave>" +
				"<element name='Entity' a:help='Entity to upgrade to'>" +
					"<text/>" +
				"</element>" +
				"<optional>" +
					"<element name='Icon' a:help='Icon to show in the GUI'>" +
						"<text/>" +
					"</element>" +
				"</optional>" +
				"<optional>" +
					"<element name='Variant' a:help='The name of the variant to switch to when upgrading'>" +
						"<text/>" +
					"</element>" +
				"</optional>" +
				"<optional>" +
					"<element name='Tooltip' a:help='This will be added to the tooltip to help the player choose why to upgrade.'>" +
						"<text/>" +
					"</element>" +
				"</optional>" +
				"<optional>" +
					"<element name='Time' a:help='Time required to upgrade this entity, in seconds'>" +
						"<data type='nonNegativeInteger'/>" +
					"</element>" +
				"</optional>" +
				"<optional>" +
					"<element name='Cost' a:help='Resource cost to upgrade this unit'>" +
						"<oneOrMore>" +
							"<choice>" +
								g_Resources.BuildSchema("nonNegativeInteger") +
							"</choice>" +
						"</oneOrMore>" +
					"</element>" +
				"</optional>" +
				"<optional>" +
					RequirementsHelper.BuildSchema() +
				"</optional>" +
				"<optional>" +
					"<element name='CheckPlacementRestrictions' a:help='Upgrading will check for placement restrictions (nb:GUI only)'><empty/></element>" +
				"</optional>" +
			"</interleave>" +
		"</element>" +
	"</oneOrMore>";

Upgrade.prototype.Init = function()
{
	this.elapsedTime = 0;
	this.expendedResources = {};
};

// This will also deal with the "OnDestroy" case.
/** @param {MessageOwnershipChanged} msg */
Upgrade.prototype.OnOwnershipChanged = function(msg)
{
	if (!this.completed)
		this.CancelUpgrade(msg.from);

	if (msg.to != INVALID_PLAYER)
	{
		this.owner = msg.to;
		this.DetermineUpgrades();
	}
};

Upgrade.prototype.DetermineUpgrades = function()
{
	this.upgradeTemplates = {};

	for (const choice in this.template)
	{
		const nativeCiv = Engine.QueryInterface(this.entity, IID_Identity)?.GetCiv();
		const playerCiv = QueryPlayerIDInterface(this.owner, IID_Identity)?.GetCiv();
		const name = this.template[choice].Entity.
			replace(/\{native\}/g, nativeCiv).
			replace(/\{civ\}/g, playerCiv);

		if (!Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager).TemplateExists(name))
			continue;

		if (this.upgradeTemplates[name])
			warn("Upgrade Component: entity " + this.entity + " has two upgrades to the same entity, only the last will be used.");

		this.upgradeTemplates[name] = choice;
	}
};

/** @param {number} amount */
Upgrade.prototype.ChangeUpgradedEntityCount = function(amount)
{
	if (!this.IsUpgrading())
		return;

	let cmpTempMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	let template = cmpTempMan.GetTemplate(/** @type {string} */(this.upgrading));

	let categoryTo;
	if (template.TrainingRestrictions)
		categoryTo = template.TrainingRestrictions.Category;
	else if (template.BuildRestrictions)
		categoryTo = template.BuildRestrictions.Category;

	if (!categoryTo)
		return;

	let categoryFrom;
	let cmpTrainingRestrictions = Engine.QueryInterface(this.entity, IID_TrainingRestrictions);
	let cmpBuildRestrictions = Engine.QueryInterface(this.entity, IID_BuildRestrictions);
	if (cmpTrainingRestrictions)
		categoryFrom = cmpTrainingRestrictions.GetCategory();
	else if (cmpBuildRestrictions)
		categoryFrom = cmpBuildRestrictions.GetCategory();

	if (categoryTo == categoryFrom)
		return;

	let cmpEntityLimits = QueryPlayerIDInterface(this.owner, IID_EntityLimits);
	if (cmpEntityLimits)
		cmpEntityLimits.ChangeCount(categoryTo, amount);
};

/** @param {string} template */
Upgrade.prototype.CanUpgradeTo = function(template)
{
	return this.upgradeTemplates[template] !== undefined;
};

Upgrade.prototype.GetUpgrades = function()
{
	let ret = [];

	for (const option in this.upgradeTemplates)
		{
		const choice = this.template[this.upgradeTemplates[option]];

		/** @type {Record<string, number>} */
		let cost = {};
		if (choice.Cost)
			cost = /** @type {Record<string, number>} */(this.GetResourceCosts(option));
		if (choice.Time)
			cost.time = /** @type {number} */(this.GetUpgradeTime(option));

		let hasCost = choice.Cost || choice.Time;
		ret.push({
			"entity": option,
			"icon": choice.Icon || undefined,
			"cost": hasCost ? cost : undefined,
			"tooltip": choice.Tooltip || undefined,
			"requirements": this.GetRequirements(option),
		});
	}

	return ret;
};

Upgrade.prototype.CancelTimer = function()
{
	if (!this.timer)
		return;

	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	cmpTimer.CancelTimer(this.timer);
	delete this.timer;
};

Upgrade.prototype.IsUpgrading = function()
{
	return !!this.upgrading;
};

Upgrade.prototype.GetUpgradingTo = function()
{
	return this.upgrading;
};

/** @param {string} template */
Upgrade.prototype.WillCheckPlacementRestrictions = function(template)
{
	if (!this.upgradeTemplates[template])
		return undefined;

	// is undefined by default so use X in Y
	return "CheckPlacementRestrictions" in this.template[this.upgradeTemplates[template]];
};

/** @param {string} templateArg */
Upgrade.prototype.GetRequirements = function(templateArg)
{
	let choice = this.upgradeTemplates[templateArg] || templateArg;

	if (this.template[choice].Requirements)
		return this.template[choice].Requirements;

	if (!("Requirements" in this.template[choice]))
		return undefined;

	let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	let cmpIdentity = Engine.QueryInterface(this.entity, IID_Identity);

	let entType = this.template[choice].Entity;
	if (cmpIdentity)
		entType = entType.replace(/\{civ\}/g, cmpIdentity.GetCiv());

	let template = cmpTemplateManager.GetTemplate(entType);
	return template.Identity.Requirements || undefined;
};

/** @param {string} template */
Upgrade.prototype.GetResourceCosts = function(template)
{
	if (!this.upgradeTemplates[template])
		return undefined;

	if (this.IsUpgrading() && template == this.GetUpgradingTo())
		return clone(this.expendedResources);

	let choice = this.upgradeTemplates[template];
	if (!this.template[choice].Cost)
		return {};

	/** @type {Record<string, number>} */
	let costs = {};
	for (let r in this.template[choice].Cost)
		costs[r] = ApplyValueModificationsToEntity("Upgrade/Cost/"+r, +this.template[choice].Cost[r], this.entity);

	return costs;
};

/** @param {string} template */
Upgrade.prototype.Upgrade = function(template)
{
	if (this.IsUpgrading() || !this.upgradeTemplates[template])
		return false;

	let cmpPlayer = QueryOwnerInterface(this.entity, IID_Player);
	if (!cmpPlayer)
		return false;

	let cmpProductionQueue = Engine.QueryInterface(this.entity, IID_ProductionQueue);
	if (cmpProductionQueue && cmpProductionQueue.HasQueuedProduction())
	{
		let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
		cmpGUIInterface.PushNotification({
			"players": [cmpPlayer.GetPlayerID()],
			"message": markForTranslation("Entity is producing. Cannot start upgrading."),
			"translateMessage": true
		});
		return false;
	}

	this.expendedResources = /** @type {Record<string, number>} */(this.GetResourceCosts(template));
	if (!cmpPlayer || !cmpPlayer.TrySubtractResources(this.expendedResources))
	{
		this.expendedResources = {};
		return false;
	}

	this.upgrading = template;
	this.SetUpgradeAnimationVariant();

	// Prevent cheating
	this.ChangeUpgradedEntityCount(1);

	if (this.GetUpgradeTime(template) !== 0)
	{
		let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
		this.timer = cmpTimer.SetInterval(this.entity, IID_Upgrade, "UpgradeProgress", 0, UPGRADING_PROGRESS_INTERVAL, { "upgrading": template });
	}
	else
		this.UpgradeProgress();

	return true;
};

/** @param {number} owner */
Upgrade.prototype.CancelUpgrade = function(owner)
{
	if (!this.IsUpgrading())
		return;

	let cmpPlayer = QueryPlayerIDInterface(owner, IID_Player);
	if (cmpPlayer)
		cmpPlayer.AddResources(this.expendedResources);

	this.expendedResources = {};
	this.ChangeUpgradedEntityCount(-1);

	// Do not update visual actor if the animation didn't change.
	let choice = this.upgradeTemplates[/** @type {string} */ (this.upgrading)];
	if (choice && this.template[choice].Variant)
	{
		let cmpVisual = Engine.QueryInterface(this.entity, IID_Visual);
		if (cmpVisual)
			cmpVisual.SelectAnimation("idle", false, 1.0);
	}

	delete this.upgrading;
	this.CancelTimer();
	this.SetElapsedTime(0);
};

/** @param {string=} templateArg */
Upgrade.prototype.GetUpgradeTime = function(templateArg)
{
	let template = templateArg || /** @type {String} */ (this.upgrading);
	let choice = this.upgradeTemplates[template];

	if (!choice) return undefined;

	if (!this.template[choice].Time) return 0;

	return ApplyValueModificationsToEntity(
		"Upgrade/Time",
		+this.template[choice].Time,
		this.entity
	);
};

Upgrade.prototype.GetElapsedTime = function()
{
	return this.elapsedTime;
};

Upgrade.prototype.GetProgress = function()
{
	if (!this.IsUpgrading())
		return undefined;
	let upgradeTime = /** @type {number} */ (this.GetUpgradeTime());
	return upgradeTime == 0 ? 1 : Math.min(/** @type {number} */ (this.elapsedTime) / 1000.0 / upgradeTime, 1.0);
};

/** @param {number} time */
Upgrade.prototype.SetElapsedTime = function(time)
{
	this.elapsedTime = time;
	Engine.PostMessage(this.entity, MT_UpgradeProgressUpdate);
};

Upgrade.prototype.SetUpgradeAnimationVariant = function()
{
	if (!this.upgrading)
		return;

	let choice = this.upgradeTemplates[this.upgrading];

	if (!choice || !this.template[choice].Variant)
		return;

	let cmpVisual = Engine.QueryInterface(this.entity, IID_Visual);
	if (!cmpVisual)
		return;

	cmpVisual.SelectAnimation(this.template[choice].Variant, false, 1.0);
};

Upgrade.prototype.UpgradeProgress = function(data = undefined, lateness = 0)
{
	if (/** @type {number} */(this.elapsedTime)/1000.0 < /** @type {number} */(this.GetUpgradeTime()))
	{
		this.SetElapsedTime(/** @type {number} */(this.GetElapsedTime()) + UPGRADING_PROGRESS_INTERVAL + lateness);
		return;
	}

	this.CancelTimer();

	this.completed = true;
	this.ChangeUpgradedEntityCount(-1);
	this.expendedResources = {};

	let newEntity = ChangeEntityTemplate(this.entity, /** @type {string} */(this.upgrading));

	if (newEntity)
		PlaySound("upgraded", newEntity);
};

Engine.RegisterComponentType(IID_Upgrade, "Upgrade", Upgrade);
