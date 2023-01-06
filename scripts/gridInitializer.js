class GridInitializer {

    constructor() {
        this.gridManager = new GridManager([9, 9]);
        this.adCoverage = new AdCoverage(this.gridManager);
        this.toolCoverage = new ToolCoverage(this.gridManager);
        this.tools = [];

        this.mainToolCell = new Vector2(4, 4);

        this.initializeTools    = this.initializeTools.bind(this);
        this.initializeAds      = this.initializeAds.bind(this);
        this.tick               = this.tick.bind(this);
        this.getAdFreeCells     = this.getAdFreeCells.bind(this);
        this.generateDifficultyFromBounds   = this.generateDifficultyFromBounds.bind(this);
        this.getDistanceToCenter            = this.getDistanceToCenter.bind(this);
        this.getMaxDistanceToCenter         = this.getMaxDistanceToCenter.bind(this);
        this.getMinDistanceToCenter         = this.getMinDistanceToCenter.bind(this);

        this.startBossFight             = this.startBossFight.bind(this);
        this.spawnBoss                  = this.spawnBoss.bind(this);
    }

    initializeTools() {
        let progressionCallback = function (gridElement, inputScore, resourcegridElementValue, isTickBased) { GameManager.progressionRequest(gridElement, inputScore, resourcegridElementValue, isTickBased); }

        // MainToolComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [4, 4, 5, 5],
            GameData.constructTool(1000, progressionCallback),
            null,
            []
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [3, 3, 5, 4],
            GameData.constructTool(6, progressionCallback, [1000, ["mainToolAuto_1", "strength_1"]]),
            new AdGenOptions(0.1, 1),
            []
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [5,3,6,5],
            GameData.constructTool(6, progressionCallback, [1000, ["strength_2"]]),
            new AdGenOptions(0.25, 1),
            []
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [4,5,6,6],
            GameData.constructTool(6, progressionCallback, [1000, ["strength_3"]]),
            new AdGenOptions(0.4, 1),
            []
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [3,4,4,6],
            GameData.constructTool(6, progressionCallback, [1000, ["strength_4"]]),
            new AdGenOptions(0.5, 1),
            []
        ));



        // ChargeMinigameComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [0,4,2,6],
            GameData.constructTool(0, progressionCallback),
            new AdGenOptions(0.0, 1),
            ["adStrike"]
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [0,6,2,7],
            GameData.constructTool(6, progressionCallback, [0]),
            new AdGenOptions(0.075, 1),
            []
        ));



        // CorrectStreakComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [0,0,2,2],
            GameData.constructTool(5, progressionCallback),
            new AdGenOptions(0.15, 1),
            ["encryption"]
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [0,2,2,3],
            GameData.constructTool(6, progressionCallback, [5]),
            new AdGenOptions(0.175, 1),
            []
        ));



        // PowerBoundsComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [7, 4, 9, 6],
            GameData.constructTool(3, progressionCallback),
            new AdGenOptions(0.2, 1),
            ["money"]
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [7, 6, 9, 7],
            GameData.constructTool(6, progressionCallback, [3]),
            new AdGenOptions(0.25, 1),
            []
        ));



        // PassiveIncomeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [3, 0, 6, 2],
            GameData.constructTool(9, progressionCallback),
            new AdGenOptions(0.5, 1), // new AdGenOptions(0.4, 1),
            ["adStrike"]
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [3, 2, 6, 3],
            GameData.constructTool(6, progressionCallback, [9]),
            new AdGenOptions(0.55, 1), // new AdGenOptions(0.425, 1),
            []
        ));



        // InvestementComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [3,6,6,8],
            GameData.constructTool(8, progressionCallback),
            new AdGenOptions(0.4, 1), // new AdGenOptions(0.5, 1),
            ["money"]
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [3,8,6,9],
            GameData.constructTool(6, progressionCallback, [8]),
            new AdGenOptions(0.5, 1), // new AdGenOptions(0.525, 1),
            []
        ));



        // ResourceExchangeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [7,0,9,2],
            GameData.constructTool(10, progressionCallback),
            new AdGenOptions(0.6, 1),
            ["encryption"]//["money", "adStrike", "encryption"]
        ));
        // UpgradeComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [7,2,9,3],
            GameData.constructTool(6, progressionCallback, [10]),
            new AdGenOptions(0.615, 1),
            []
        ));
        



        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [2,3,3,4],
            GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.35, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [6,3,7,4],
            GameData.constructTool(11, progressionCallback, [[new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.3, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [2,5,3,6],
            GameData.constructTool(11, progressionCallback, [[new IdValue("encryption", GameManager.resourceManager.getLevelReq("encryption", 0.45, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [6,5,7,6],
            GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.35, true))]]),
            null,
            []
        ));

        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [2,1,3,2],
            GameData.constructTool(11, progressionCallback, [[new IdValue("encryption", GameManager.resourceManager.getLevelReq("encryption", 0.6, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [6,1,7,2],
            GameData.constructTool(11, progressionCallback, [[new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.7, true))]]),
            null,
            []
        ));
        // // SurpriseMechanicComponent
        // this.toolCoverage.initTool(new ToolGridElement(
        //     [2,7,3,8],
        //     GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.7, true))]]),
        //     null,
        //     []
        // ));
        // // SurpriseMechanicComponent
        // this.toolCoverage.initTool(new ToolGridElement(
        //     [6,7,7,8],
        //     GameData.constructTool(11, progressionCallback, [[new IdValue("encryption", GameManager.resourceManager.getLevelReq("encryption", 0.7, true))]]),
        //     null,
        //     []
        // ));

        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [1,8,2,9],
            GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.75, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [7,8,8,9],
            GameData.constructTool(11, progressionCallback, [[new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.75, true))]]),
            null,
            []
        ));

        // // SurpriseMechanicComponent
        // this.toolCoverage.initTool(new ToolGridElement(
        //     [0,7,1,8],
        //     GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.75, true))]]),
        //     null,
        //     []
        // ));
        // // SurpriseMechanicComponent
        // this.toolCoverage.initTool(new ToolGridElement(
        //     [8, 7, 9, 8],
        //     GameData.constructTool(11, progressionCallback, [[new IdValue("encryption", GameManager.resourceManager.getLevelReq("encryption", 0.6, true))]]),
        //     null,
        //     []
        // ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [2,8,3,9],
            GameData.constructTool(11, progressionCallback, [[new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.8, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [6,8,7,9],
            GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.8, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [0, 8, 1, 9],
            GameData.constructTool(11, progressionCallback, [[new IdValue("encryption", GameManager.resourceManager.getLevelReq("encryption", 0.7, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [8, 8, 9, 9],
            GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.8, true))]]),
            null,
            []
        ));

        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [2, 4, 3, 5],
            GameData.constructTool(11, progressionCallback, [[new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.4, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [6, 4, 7, 5],
            GameData.constructTool(11, progressionCallback, [[new IdValue("encryption", GameManager.resourceManager.getLevelReq("encryption", 0.5, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [0, 3, 1, 4],
            GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", 0.75, true))]]),
            null,
            []
        ));
        // SurpriseMechanicComponent
        this.toolCoverage.initTool(new ToolGridElement(
            [8, 3, 9, 4],
            GameData.constructTool(11, progressionCallback, [[new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.8, true))]]),
            null,
            []
        ));



        this.toolCoverage.loadUnspawnedTools();        
    }

    initializeAds() {
        {
            // Fill ads for tools
            for (let tool of this.toolCoverage.tools) {
                //tool.setCoveringAd(null);
                //continue;

                if (tool.adGenOptions == null || tool.adGenOptions == undefined) {
                    tool.setCoveringAd(null);
                    continue;
                }

                let growDirection = new Vector2(1, 0);
                if (tool.ownedTool.id == 6) {
                    growDirection = this.generateGrowDirection(tool.gridBounds, this.adCoverage.totalAdCovers);
                }

                let ad = new AdCover(
                    [tool.gridBounds[0].x, tool.gridBounds[0].y, tool.gridBounds[1].x, tool.gridBounds[1].y], growDirection,
                    tool.adGenOptions.difficulty,
                    "Ad!",
                    "Problemo?)"
                );

                this.adCoverage.initAdCover(ad);
                tool.setCoveringAd(ad);
            }

            // Create the final ad
            {
                let ad = new AdCover(
                    [8, 8, 9, 9], new Vector2(0, 1),
                    -1,
                    "???",
                    "???"
                );
                this.adCoverage.initAdCover(ad);
            }

            // Fill special-sized ads
            let seedEffector = 0; // Fake random seeding, is sufficient
            let specialAdSizes = [ // [xSize, ySize]
                [3, 1],
                [3, 1],
                [3, 1],

                [2, 2],
                [2, 2],

                [2, 1],
                [2, 1],
                [2, 1],

                [1, 2],
                [1, 2],
                [1, 2]
            ]
            for (let size of specialAdSizes) {
                let boundsList = this.gridManager.findAdFreeBounds([size[0], size[1]], [this.mainToolCell]);

                if (boundsList == null || boundsList == undefined) {
                }
                else {
                    if (seedEffector > boundsList.length - 1) seedEffector = 0;
                    let bounds = boundsList[seedEffector];
                    seedEffector++;

                    let ad = new AdCover(
                        [bounds[0], bounds[1], bounds[2], bounds[3]], this.generateGrowDirection([new Vector2(bounds[0], bounds[1]), new Vector2(bounds[2], bounds[3])], this.adCoverage.totalAdCovers),
                        this.generateDifficultyFromBounds(bounds),
                        "Ad!",
                        "CHONK!!!"
                    );

                    this.adCoverage.initAdCover(ad);
                }
            }

            // Fill the rest of the grid
            let freeTiles = GameManager.gridInitializer.getAdFreeCells();
            for (let tile of freeTiles) {
                let bounds = [tile.coord.x, tile.coord.y, tile.coord.x + 1, tile.coord.y + 1];

                let ad = new AdCover(
                    [bounds[0], bounds[1], bounds[2], bounds[3]], this.generateGrowDirection([new Vector2(bounds[0], bounds[1]), new Vector2(bounds[2], bounds[3])], this.adCoverage.totalAdCovers),
                    this.generateDifficultyFromBounds(bounds),
                    "Ad!",
                    "RANDOM!"
                );

                this.adCoverage.initAdCover(ad);
            }     
        }
    }

    tick(deltaTime) {
        this.gridManager.tick(deltaTime);
        this.adCoverage.tick(deltaTime);
        this.toolCoverage.tick(deltaTime);

        for (let tool of this.tools) {
            tool.tick(deltaTime);
        }
    }

    getAdFreeCells() {
        let freeCells = this.toolCoverage.gridManager.getCells_NoAds([this.mainToolCell]);

        return freeCells;
    }

    updateToLoadedData() {
        // GameLoad

        // update tools
        let toolsData = GameManager.gameSave.readProperty("toolsData");
        for (let toolId in toolsData) {
            if (!Object.prototype.hasOwnProperty.call(toolsData, toolId)) continue;
            let toolData = toolsData[toolId];

            let toolCover = null;
            for (let tool of this.toolCoverage.tools) {
                if (toolData.id == tool.id) {
                    toolCover = tool;
                    break;
                }
            }
            if (toolCover == null) continue;

            if (toolData.isRemoved === true) {
                this.toolCoverage.removeTool(toolCover.ownedTool);
                continue;
            }

            toolCover.ownedTool.updateComponentPersonalData(toolData.personalData);
            toolCover.ownedTool.useCycles = toolData.useCycles;
            toolCover.ownedTool.failedCycles = toolData.failedCycles;
            for (let resourceId in toolData.resourcesGained) {
                if (!Object.prototype.hasOwnProperty.call(toolData.resourcesGained, resourceId)) continue;
                let resource = new IdValue(resourceId, toolData.resourcesGained[resourceId]);

                toolCover.ownedTool.resourcesGained = {};
                toolCover.ownedTool.resourcesGained[resource.id] = resource.value;
            }
            for (let resourceId in toolData.resourcesSpent) {
                if (!Object.prototype.hasOwnProperty.call(toolData.resourcesSpent, resourceId)) continue;
                let resource = new IdValue(resourceId, toolData.resourcesSpent[resourceId]);

                toolCover.ownedTool.resourcesSpent = {}
                toolCover.ownedTool.resourcesSpent[resource.id] = resource.value;
            }
        }

        // update ads
        let adsData = GameManager.gameSave.readProperty("adsData");
        for (let adId in adsData) {
            if (!Object.prototype.hasOwnProperty.call(adsData, adId)) continue;
            let adData = adsData[adId];

            let adCover = null;
            for (let ad of this.adCoverage.adCovers) {
                if (adData.id == ad.id) {
                    adCover = ad;
                    break;
                }
            }
            if (adCover == null) continue;

            if (adData.isBlocked === true) {
                adCover.requestPurge(null, true, true);
                continue;
            }

            adCover.cachedPurgeCostOffset = adData.cachedPurgeCostOffset;
            adCover.addEncryption(adData.encryption);
            adCover.setGrow(1);
            adCover.setAdImage(adData.imgSrc);
        }

        // if (GameManager.gameSave.readProperty("isEndlessMode") === true) {
        //     let adsData = GameManager.gameSave.readProperty("adsData")
        //     for (let adDataId in adsData) {
        //         let adData = adsData[adDataId];
        //         if (adData.isBlocked === true || adData.isBossPart != true) continue;

        //         let adCover = new AdCover(
        //             [adData.gridBounds[0].x, adData.gridBounds[0].y, adData.gridBounds[1].x, adData.gridBounds[1].y], adData.growDirection,
        //             adData.adDifficulty
        //         );
                
        //         this.adCoverage.initAdCover(adCover);
                
        //         adCover.cachedPurgeCostOffset = adData.cachedPurgeCostOffset;
        //         adCover.addEncryption(adData.encryption);
        //         adCover.setGrow(1);
        //         adCover.setAdImage(adData.imgSrc);
        //     }
        // }
    }


    generateGrowDirection(gridBounds, id) {
        let random = id % 2;
        if (Math.abs(gridBounds[1].y - gridBounds[0].y) > Math.abs(gridBounds[1].x - gridBounds[0].x)) {
            return random <= 0 ? new Vector2(0, -1) : new Vector2(0, 1);
        }
        else {
            return random <= 0 ? new Vector2(-1, 0) : new Vector2(1, 0);
        }
    }
    generateDifficultyFromBounds(bounds) {
        let biggestDistance = this.getMinDistanceToCenter();
        let smallestDistance = this.getMaxDistanceToCenter();

        for (let x = bounds[0]; x < bounds[2]; x++) {
            for (let y = bounds[1]; y < bounds[3]; y++) {
                let dist = this.getDistanceToCenter(new Vector2(x, y));
                if (dist < smallestDistance) {
                    smallestDistance = dist;
                }
                if (dist > biggestDistance) {
                    biggestDistance = dist;
                }
            }
        }

        let averageDistance = (smallestDistance + biggestDistance) * 0.5;

        //return smallestDistance / this.getMaxDistanceToCenter();
        let difficulty = FunLib.clamp((averageDistance - this.getMinDistanceToCenter() * 0.5) / (this.getMaxDistanceToCenter() - this.getMinDistanceToCenter() * 0.5), 0, 1);
        if (difficulty > 0.7) {
            difficulty = 0.7 + ((1 - difficulty) / 0.3 * 0.1);
        }
        return difficulty;
    }

    getDistanceToCenter(coord) {
        return coord.distance(this.mainToolCell);
    }

    getMaxDistanceToCenter() {
        return this.getDistanceToCenter(new Vector2(0, 0));
    }

    getMinDistanceToCenter() {
        return this.getDistanceToCenter(new Vector2(this.mainToolCell.x - 1, this.mainToolCell.y));
    }

    startBossFight(fromAdCover) {
        GameManager.saveGame_scheduled();
        if (GameManager.gameSave.readProperty("isEndlessMode") != true) {
            GameManager.showSaveMessage(4);
        }
        else {
            GameManager.showSaveMessage(5);
        }

        GameManager.upgradeManager.forceUnlockUpgrade("strength_1");
        GameManager.upgradeManager.forceUnlockUpgrade("strength_2");
        GameManager.upgradeManager.forceUnlockUpgrade("strength_3");
        GameManager.upgradeManager.forceUnlockUpgrade("strength_4");

        for (let tool of this.toolCoverage.tools) {
            if (tool.ownedTool.id == 1000) {
                tool.layoutElement.style["z-index"] = "9";
                break;
            }
        }

        //if (GameManager.gameSave.readProperty("isEndlessMode") === true) return;

        let bossGridBounds = [3, 3, 6, 6];

        // GameLoad
        if (fromAdCover != null && fromAdCover != undefined && fromAdCover.isBossPart === false && GameManager.gameSave.readProperty("adsData")[fromAdCover.id].isBlocked === false) {
            let filename = fromAdCover.imgSrc.substring(fromAdCover.imgSrc.length - 5, fromAdCover.imgSrc.length);
            let imageFileString = "ads/3x3/" + filename;
            fromAdCover.setAdImage(imageFileString);
            
            let adGridBounds = [fromAdCover.gridBounds[0].x, fromAdCover.gridBounds[0].y, fromAdCover.gridBounds[1].x, fromAdCover.gridBounds[1].y];
            this.gridManager.animateBossTransition_in(fromAdCover, adGridBounds, bossGridBounds, function () { this.spawnBoss(bossGridBounds, imageFileString); }.bind(this));
        }
        else {
            TimerManager.setTimer(1, function () {
                this.spawnBoss(bossGridBounds, null);
            }.bind(this));
        }
    }

    spawnBoss(bossGridBounds, imageFileString) {
        if (GameManager.gameSave.readProperty("isEndlessMode") != true) {
            let ad = new BossAdCover(bossGridBounds, this.adCoverage);
            let adInitialized = false;

            // GameLoad
            let saveData = GameManager.gameSave.readProperty("bossData");
            if (saveData == undefined || saveData == null) {

                // GameSave
                saveData = new SaveData_Boss(this.adCoverage.totalAdCovers + 1, false, ad.gridBounds, 0, imageFileString, 0);
                GameManager.gameSave.writeProperty("bossData", saveData);
                GameManager.saveGame_scheduled();

                this.adCoverage.initAdCover(ad);
                adInitialized = true;
            }

            GameManager.bossStarted = true;
            if (saveData.adData.isBlocked === true) {
                GameManager.bossStarted = false;
                GameManager.bossDefeated = true;
                GameManager.gameWon();
                return;
            }

            if (adInitialized === false) {
                this.adCoverage.initAdCover(ad);
                adInitialized = true;
            }

            ad.updateToLoadedData();
        }
        else {
            let ad = new EndlessBossAdCover(bossGridBounds, this.adCoverage);

            let saveData = new SaveData_Boss(this.adCoverage.totalAdCovers + 1, false, ad.gridBounds, 0, imageFileString, 0);
            saveData.isEndless = true;
            GameManager.gameSave.writeProperty("bossData", saveData);

            this.adCoverage.initAdCover(ad);
        }
    }

    startBossFight_debug() {
        this.startBossFight(this.adCoverage.adCovers[0]);
    }


    initiateEndlessMode() {
        this.toolCoverage.removeAllTools();
        this.initializeTools();
        this.toolCoverage.uncoverAllTools();
        this.toolCoverage.removeAllSurpriseMechanicTools();
        
        this.adCoverage.purgeAllAds();
    }
    loadEndlessMode() {
        if (GameManager.gameSave.readProperty("bossData") == undefined || GameManager.gameSave.readProperty("bossData") == null) {
            this.startBossFight(this.adCoverage.adCovers[0]);
        }
        else {
            for (let tool of this.toolCoverage.tools) {
                if (tool.ownedTool.id == 1000) {
                    tool.layoutElement.style["z-index"] = "9";
                    break;
                }
            }
            
            let bossGridBounds = [3, 3, 6, 6];
            let boss = new EndlessBossAdCover(bossGridBounds, this.adCoverage);
            boss.pendingSaveDataUpdate = true;
            this.adCoverage.initAdCover(boss);

            boss.updateToLoadedData();
        }   
    }
}