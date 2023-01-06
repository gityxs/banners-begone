class ToolCoverage {

    constructor(gridManager) {
        this.tools = []; // Tool[]???
        this.totalTools = 0;
        this.gridManager = gridManager;
        this.toolIdList =[];

        this.tick = this.tick.bind(this);
        this.initTool = this.initTool.bind(this);
        this.removeTool = this.removeTool.bind(this);
    }

    tick(deltaTime) {
        for (let tool of this.tools) {
            tool.tick(deltaTime);
        }
    }

    initTool(tool) {
        if (tool == undefined || tool == null) return;

        tool.setId(++this.totalTools);
        tool.constructElement();
        this.gridManager.addGridElement(tool, tool.gridBounds);
        tool.activate(tool.interactionElement);
        this.tools.push(tool);

        document.getElementById("mainGridContainer").appendChild(tool.layoutElement);

        // GameLoad
        let saveData = GameManager.gameSave.readProperty("toolsData")[tool.id];
        if (saveData == undefined || saveData == null) {
            // GameSave
            GameManager.gameSave.readProperty("toolsData")[tool.id] = new SaveData_Tool(tool.id, false, tool.gridBounds, GameData.getFancyToolName(tool.ownedTool.id));
        }   

        this.toolIdList.push(tool.id);

        return tool;
    }

    reRegisterToolsForUpgrades() {
        for (let tool of this.tools) {
            tool.ownedTool.registerForUpgrades();
        }
    }

    loadUnspawnedTools() {
        let progressionCallback = function (gridElement, inputScore, resourcegridElementValue, isTickBased) { GameManager.progressionRequest(gridElement, inputScore, resourcegridElementValue, isTickBased); }

        // GameLoad
        let saveDatas = GameManager.gameSave.readProperty("toolsData");
        for (let propName in saveDatas) {
            if (Object.prototype.hasOwnProperty.call(saveDatas, propName)) {
                let saveData = saveDatas[propName];

                if (this.toolIdList.includes(saveData.id)) continue;

                let tool = new ToolGridElement(
                    [saveData.gridBounds[0].x, saveData.gridBounds[0].y, saveData.gridBounds[1].x, saveData.gridBounds[1].y],
                    GameData.constructTool(11, progressionCallback, [saveData.personalData["SurpriseMechanicComponent_rewards"]]),
                    null,
                    []
                )
                this.initTool(tool);
                tool.interactionElement.classList.add("supriseSpawnedFromAI");
            }
        }
    }

    removeAllTools() {
        let toolsArray = this.tools.slice(0);

        for (let toolCover of toolsArray) {
            this.removeToolCover(toolCover);
        }

        this.tools = [];
        this.totalTools = 0;
        this.toolIdList = [];
    }

    removeAllSurpriseMechanicTools() {
        let toolsArray = this.tools.slice(0);

        for (let toolCover of toolsArray) {
            if (GameData.getFancyToolName(toolCover.ownedTool.id) === "Surprise-Mechanic") {
                this.removeToolCover(toolCover);
            }
        }
    }

    uncoverAllTools() {
        for (let toolCover of this.tools) {
            toolCover.setCoveringAd(null);
        }
    }

    removeTool(tool) {
        let toolCover = this.tools.find(function (element, index, array) {
            return element.ownedTool == tool;
        });

        this.removeToolCover(toolCover);
        GameManager.saveGame();
    }
    removeToolCover(toolCover) {
        toolCover.ownedTool.deactivate();
        FunLib.removeFromArray(this.tools, toolCover);
        this.gridManager.removeGridElement(toolCover);
        toolCover.layoutElement.remove();

        // GameSave
        GameManager.gameSave.readProperty("toolsData")[toolCover.id].isRemoved = true;
    }

    setAccessibility(state) {
        for (let tool of this.tools) {
            tool.ownedTool.inputHandler.setAutoClickEnabled(state);
        }
    }
}