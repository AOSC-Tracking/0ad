/**
 * This class manages the population counter in the top panel.
 * It flashes the counter if the training of any owned entity is blocked.
 */
class CounterPopulation
{
	constructor(resCode, panel, icon, count, stats)
	{
		this.resCode = resCode;
		this.panel = panel;
		this.icon = icon;
		this.count = count;
		this.count.onTick = this.onTick.bind(this);
		this.isTrainingBlocked = false;
		this.color = this.DefaultPopulationColor;
		this.stats = stats;
	}

	rebuild(playerState, getAllyStatTooltip)
	{
		this.count.caption = sprintf(translate(this.CounterCaption), playerState);
		let total = 0;
		for (const resCode of g_ResourceData.GetCodes())
			total += playerState.resourceGatherers[resCode];

		this.stats.caption = coloredText(total, total ? this.DefaultTotalGatherersColor : this.DefaultTotalGatherersColorZero);

		this.isTrainingBlocked = playerState.trainingBlocked;

		this.panel.tooltip =
			setStringTags(translate(this.PopulationTooltip), CounterManager.ResourceTitleTags) +
			"\n" +
			translate("Build Houses and Civic Centers to increase the limit.") +
			getAllyStatTooltip(this.getTooltipData.bind(this)) +
			"\n" +
			sprintf(translate(this.CurrentPopulationTooltip), playerState) +
			"\n" +
			sprintf(translate(this.LimitPopulationTooltip), playerState) +
			"\n" +
			sprintf(translate(this.MaxPopulationTooltip), playerState) +
			"\n" +
			sprintf(translate(this.TotalGatherersTooltip), { "total": total });
	}

	getTooltipData(playerState, playername)
	{
		return {
			"playername": playername,
			"statValue": sprintf(translate(this.AllyPopulationTooltip), playerState),
			"orderValue": playerState.popCount
		};
	}

	onTick()
	{
		if (this.panel.hidden)
			return;

		const newColor = this.isTrainingBlocked && Date.now() % 1000 < 500 ?
			this.PopulationAlertColor :
			this.DefaultPopulationColor;

		if (newColor == this.color)
			return;

		this.color = newColor;
		this.count.textcolor = newColor;
	}
}
// Translation: Do not insert spaces around the slash symbol for this exact string. Keep only one space between popLimit and popMax.
CounterPopulation.prototype.CounterCaption = markForTranslation("%(popCount)s/%(popLimit)s (%(popMax)s)");

CounterPopulation.prototype.PopulationTooltip = markForTranslation("Population: current/limit (max)");

CounterPopulation.prototype.AllyPopulationTooltip = markForTranslation("%(popCount)s/%(popLimit)s (%(popMax)s)");

/**
 * Store the translated and formatted string for total gatherers in the prototype.
 */
CounterPopulation.prototype.TotalGatherersTooltip = markForTranslation("Total gatherers: %(total)s");

/**
 * Store the translated and formatted string for max population in the prototype.
 */
CounterPopulation.prototype.MaxPopulationTooltip = markForTranslation("Max population: %(popMax)s");

/**
 * Store the translated and formatted string for current population in the prototype.
 */
CounterPopulation.prototype.CurrentPopulationTooltip = markForTranslation("Current population: %(popCount)s");

/**
 * Store the translated and formatted string for population cap in the prototype.
 */
CounterPopulation.prototype.LimitPopulationTooltip = markForTranslation("Population limit: %(popLimit)s");

/**
 * Color to highlight the total number of gatherers at zero.
 */
CounterPopulation.prototype.DefaultTotalGatherersColorZero = "200 200 200";

/**
 * Color to highlight the total number of gatherers.
 */
CounterPopulation.prototype.DefaultTotalGatherersColor = "gold";

/**
 * Colors to flash when pop limit reached.
 */
CounterPopulation.prototype.DefaultPopulationColor = "white";
CounterPopulation.prototype.PopulationAlertColor = "orange";
