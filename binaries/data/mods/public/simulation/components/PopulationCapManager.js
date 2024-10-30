function PopulationCapManager() {}

PopulationCapManager.prototype.Schema =
	"<a:component type='system'/><empty/>";

PopulationCapManager.prototype.SetPopulationCapType = function(type)
{
	this.popCapType = type;
	if(this.popCap)
		this.InitializePopCaps();
};

PopulationCapManager.prototype.GetPopulationCapType = function()
{
	return this.popCapType;
};

PopulationCapManager.prototype.SetPopulationCap = function(cap)
{
	this.popCap = cap;
	if (this.popCapType)
		this.InitializePopCaps();
};

PopulationCapManager.prototype.GetPopulationCap = function()
{
	return this.popCap;
};

PopulationCapManager.prototype.InitializePopCaps = function()
{
	switch(this.popCapType)
	{
	case "player":
		this.InitializePlayerPopCaps();
		break;

	case "team":
		this.InitializeTeamPopCaps();
		break;

	case "world":
		this.RedistributeWorldPopCap();
		break;

	default: break;
	}
};

PopulationCapManager.prototype.InitializePlayerPopCaps = function()
{
	const players = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager).GetNonGaiaPlayers();
	for (const player of players)
		QueryPlayerIDInterface(player, IID_Player)
			.SetMaxPopulation(this.popCap);
};

PopulationCapManager.prototype.InitializeTeamPopCaps = function()
{
	const players = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager).GetNonGaiaPlayers();
	// Keeps track which teams the population caps have already been calculated for.
	let teamList = [];
	for (const player of players)
	{
		const team = QueryPlayerIDInterface(player, IID_Diplomacy).GetTeam();
		if (teamList.includes(team))
			continue;
		teamList.push(team);
		this.RedistributeTeamPopCap(team);
	}
};

PopulationCapManager.prototype.RedistributeTeamPopCap = function(team)
{
	const activePlayers = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager).GetActivePlayers();
	const teamMembers = activePlayers.reduce((list, player) => {
		if (QueryPlayerIDInterface(player, IID_Diplomacy).GetTeam() === team)
			list.push(player);
		return list;
	}, []);

	// Players of team -1 aren't part of any team and need to be assigned the full team pop cap.
	const newPopulationCap = team === -1 ? this.popCap : this.popCap / teamMembers.length;
	for (const teamMember of teamMembers)
		QueryPlayerIDInterface(teamMember, IID_Player)
			.SetMaxPopulation(newPopulationCap);
};

PopulationCapManager.prototype.RedistributeWorldPopCap = function()
{
	const activePlayers = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager).GetActivePlayers();
	if (!activePlayers.length)
		return;

	const newPopulationCap = this.popCap / activePlayers.length;
	for (const player of activePlayers)
		QueryPlayerIDInterface(player, IID_Player).SetMaxPopulation(newPopulationCap);

};

PopulationCapManager.prototype.OnGlobalPlayerDefeated = function(msg)
{
	switch(this.popCapType)
	{
	case "team":
		const team = QueryPlayerIDInterface(msg.playerId, IID_Diplomacy).GetTeam();
		// Don't redistribute if the player wasn't part of a team.
		if (team != -1)
			this.RedistributeTeamPopCap(team);
		break;

	case "world":
		this.RedistributeWorldPopCap();
		break;

	default: break;
	}

};

Engine.RegisterSystemComponentType(IID_PopulationCapManager, "PopulationCapManager", PopulationCapManager);
