class StatsOverlay
{
    constructor()
    {
        this.overlay = Engine.GetGUIObjectByName("statsOverlay");
        this.font = "mono-stroke-10";
        this.bufferZone = 4;

        this.columns = {
            "Player": p => p.name ?? "-",
            "■": () => "■",
            "#": p => (p.team > -1 ? p.team + 1 : 0),
            "Phase": p => {
                const phase = p.phase ?? "";
                if (phase.includes("village")) return "I";
                if (phase.includes("town")) return "II";
                if (phase.includes("city")) return "III";
                return "-";
            },
            "Pop": p => p.popCount ?? 0,
            "Sup": p => p.classCounts?.Support ?? 0,
            "Inf": p => p.classCounts?.Infantry ?? 0,
            "Cav": p => p.classCounts?.Cavalry ?? 0,
            "Sig": p => p.classCounts?.Siege ?? 0,
            "Chp": p => p.classCounts?.Champion ?? 0,
            "Food": p => Math.round(p.resourceCounts?.food ?? 0),
            "Wood": p => Math.round(p.resourceCounts?.wood ?? 0),
            "Stone": p => Math.round(p.resourceCounts?.stone ?? 0),
            "Metal": p => Math.round(p.resourceCounts?.metal ?? 0),
            "Tec": p => p.researchedTechs?.length ?? 0,
            "Kill": p => p.enemyUnitsKilled ?? 0
        };

        this.colWidths = {
            "Player": 16,
            "■": 2,
            "#": 3,
            "Phase": 5,
            "Pop": 5,
            "Sup": 5,
            "Inf": 5,
            "Cav": 5,
            "Sig": 5,
            "Chp": 5,
            "Food": 7,
            "Wood": 7,
            "Stone": 7,
            "Metal": 7,
            "Tec": 4,
            "Kill": 5
        };

        this.minWidth = 410;
        this.minHeight = 200;
        this.verticalOffset = 180;
        this.lineHeightFactor = 1.2;
    }

    leftAlign(text, width)
    {
        const str = text.toString();
        if (str.length > width)
            return str.slice(0, width - 1) + "…";
        return str.padEnd(width);
    }

    getPlayerColorRGB(playerColor)
    {
        const brighten = c => Math.min(255, Math.round(c * 255 + 40));
        return `${brighten(playerColor.r)} ${brighten(playerColor.g)} ${brighten(playerColor.b)}`;
    }

    update()
    {
        if (!this.overlay)
        {
            warn("StatsOverlay: overlay not initialized.");
            return;
        }

        const state = Engine.GuiInterfaceCall("GetSimulationState");
        if (!state?.players)
        {
            warn("StatsOverlay: no players.");
            return;
        }

        const myID = Engine.GetPlayerID();
        const myPlayer = state.players[myID];
        if (!myPlayer)
        {
            warn("StatsOverlay: player not found.");
            return;
        }

        const visiblePlayers = state.players
            .map((p, i) => ({ player: p, index: i }))
            .filter(({ player, index }) => {
                if (index === 0) return false;
                if (!controlsPlayer(myID)) return true;
                return index === myID || (myPlayer.isMutualAlly?.[index] ?? false);
            });

        if (!visiblePlayers.length)
        {
            warn("StatsOverlay: no visible players.");
            return;
        }

        const headers = Object.keys(this.colWidths);
        const headerLine = setStringTags(
            headers.map(header =>
                this.leftAlign(header, this.colWidths[header])
            ).join(" "),
            { color: "180 180 180" }
        );

        const bodyLines = visiblePlayers.map(({ player: p }) => {
            const row = headers.map(h => {
                const valFn = this.columns[h];
                if (!valFn)
                {
                    warn("StatsOverlay: column function missing for " + h);
                    return "?".padEnd(this.colWidths[h]);
                }
                return this.leftAlign(valFn(p).toString(), this.colWidths[h]);
            }).join(" ");
            const color = this.getPlayerColorRGB(p.color);
            return setStringTags(row, { color });
        });

        const fullText = [headerLine, ...bodyLines].join("\n");

        if (!fullText.trim())
        {
            warn("StatsOverlay: empty text.");
            return;
        }

        const charWidth = Engine.GetTextWidth(this.font, " ") || 6;
        const rowLength = headers.reduce((sum, key) => sum + this.colWidths[key], headers.length - 1);
        const rowCount = bodyLines.length + 1;

        const padding = this.bufferZone * 2 + 20;
        const width = Math.max(this.minWidth, charWidth * rowLength + padding);
        const height = Math.max(this.minHeight, Math.ceil(charWidth * this.lineHeightFactor * rowCount + padding));

        this.overlay.size = `100%-${width} 100%-${this.verticalOffset}-${height} 100% 100%-${this.verticalOffset}`;
        this.overlay.caption = setStringTags(fullText, {
            font: this.font
        });
    }
}