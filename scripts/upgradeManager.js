class UpgradeManager {

    constructor(maxToolId) {
        this.activeUpgrades = []; // ToolUpgrade[]
        this.availableUpgrades = []; // ToolUpgrade[]
        this.totalUpgrades = []; // ToolUpgrade[]
        // Index used equals tool id given on construction
        this.toolsMembers = []; // ToolMembers[]

        this.upgradeTemplates = []; // UpgradeTemplate[]

        this.upgradeAvailable_callbacks = [];
        this.upgradeActive_callbacks = [];

        this.initUpgrades           = this.initUpgrades.bind(this);
        this.refreshUpgrades        = this.refreshUpgrades.bind(this);
        this.requestUpgradeUnlock   = this.requestUpgradeUnlock.bind(this);
        this.forceUnlockUpgrade     = this.forceUnlockUpgrade.bind(this);
        this.updateToolMembers      = this.updateToolMembers.bind(this);
        this.getUpgrade             = this.getUpgrade.bind(this);

        this.initUpgrades();
    }

    static registerTool(toolId, memberIdValues) {
        let upgradeManagerInst = GameManager.upgradeManager;

        if (toolId > upgradeManagerInst.toolsMembers.length - 1) {
            for (let index = upgradeManagerInst.toolsMembers.length - 1; index < toolId; index++) {
                upgradeManagerInst.toolsMembers.push(new ToolMembers());
            }
        }

        let toolMembers = upgradeManagerInst.toolsMembers[toolId];
        toolMembers.init(memberIdValues);
    }

    static getMemberValue(toolId, memberName) {
        let upgradeManagerInst = GameManager.upgradeManager;

        return upgradeManagerInst.toolsMembers[toolId].getValue(memberName);
    }

    // Upgrades
    initUpgrades() {

        // Main Tool
        this.totalUpgrades.push(new ToolUpgrade(
            1000,
            "strength_1",
            "Bouncer I",
            "Increase the push power",
            [new IdValue("strength", 1.25)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.15, true))],
            [],
            []
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            1000,
            "strength_2",
            "Bouncer II",
            "Increase the push power",
            [new IdValue("strength", 1.3)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.25, true))],
            [],
            []
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            1000,
            "strength_3",
            "Bouncer III",
            "Increase the push power",
            [new IdValue("strength", 1.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.45, true))],
            [],
            []
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            1000,
            "strength_4",
            "Bouncer IV",
            "Maximize the push power",
            [new IdValue("strength", 2)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.7, true))],
            [],
            []
        ));



        // Charge Tool
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "actionDurationMultiplier_1",
            "Effectiveness I",
            "Increase the Ad-Blocker gain",
            [new IdValue("spinReward", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.2, true))],
            [],
            []
        ));  
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "actionDurationMultiplier_2",
            "Effectiveness II",
            "Increase the Ad-Blocker gain once more",
            [new IdValue("spinReward", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.3, true))],
            [],
            ["actionDurationMultiplier_1"]
        ));  
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "actionDurationMultiplier_3",
            "Effectiveness III",
            "Increase the Ad-Blocker gain even more",
            [new IdValue("spinReward", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.75, true))],
            [],
            ["actionDurationMultiplier_2"]
        ));  
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "actionDurationMultiplier_4",
            "Effectiveness IV",
            "Maximize the Ad-Blocker gain",
            [new IdValue("spinReward", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.95, true))],
            [],
            ["actionDurationMultiplier_3"]
        ));  
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "maxPlayerSpins_1",
            "Momentum I",
            "Add one charge",
            [new IdValue("maxPlayerSpins", 1.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.2, true))],
            [],
            []
        ));   
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "maxPlayerSpins_2",
            "Momentum II",
            "Add another charge",
            [new IdValue("maxPlayerSpins", 1.333333)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.4, true))],
            [],
            ["maxPlayerSpins_1"]
        ));  
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "maxPlayerSpins_3",
            "Momentum III",
            "Add final charge",
            [new IdValue("maxPlayerSpins", 1.25)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.75, true))],
            [],
            ["maxPlayerSpins_2"]
        ));   
        this.totalUpgrades.push(new ToolUpgrade(
            0,
            "playerSpinRegenCooldown_1",
            "Overcharge",
            "Halve charge regeneration time",
            [new IdValue("playerSpinRegenCooldown", 0.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.95, true))],
            [],
            ["actionDurationMultiplier_3", "maxPlayerSpins_3"]
        ));  
         


        // Correct Streak Tool
        this.totalUpgrades.push(new ToolUpgrade(
            5,
            "reward_1",
            "Complexity I",
            "Increase generation reward and complexity",
            [new IdValue("maxReward", 4), new IdValue("punchCardLength", 1.25)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.175, true))],
            [],
            []
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            5,
            "reward_2",
            "Complexity II",
            "Increase generation reward and complexity even more",
            [new IdValue("maxReward", 4), new IdValue("punchCardLength", 1.2)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.55, true))],
            [],
            ["reward_1"]
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            5,
            "reward_3",
            "Complexity III",
            "Maximise generation reward and complexity",
            [new IdValue("maxReward", 4), new IdValue("punchCardLength", 1.166667)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.8, true))],
            [],
            ["reward_2"]
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            5,
            "cycleDuration_1",
            "Haste I",
            "Sequences generate faster",
            [new IdValue("memberGenerationSpeed", 0.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.3, true))],
            [],
            []
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            5,
            "cycleDuration_2",
            "Haste II",
            "Sequences generate at maximum speed",
            [new IdValue("memberGenerationSpeed", 0.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.6, true))],
            [],
            ["cycleDuration_1"]
        ));



        // Power Bounds Tool
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "maxPowerInputScore_1",
            "Excellence I",
            "Increase the max gain",
            [new IdValue("maxPowerInputScore", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.2, true))],
            [],
            []
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "maxPowerInputScore_2",
            "Excellence II",
            "Increase the max gain again",
            [new IdValue("maxPowerInputScore", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.35, true))],
            [],
            ["maxPowerInputScore_1"]
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "maxPowerInputScore_3",
            "Excellence III",
            "Increase the max gain once more",
            [new IdValue("maxPowerInputScore", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.6, true))],
            [],
            ["maxPowerInputScore_2"]
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "maxPowerInputScore_4",
            "Excellence IV",
            "Increase the max gain even more",
            [new IdValue("maxPowerInputScore", 4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.8, true))],
            [],
            ["maxPowerInputScore_3"]
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "maxPowerInputScore_5",
            "Excellence V",
            "Maximize the max gain",
            [new IdValue("maxPowerInputScore", 2)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.95, true))],
            [],
            ["maxPowerInputScore_4"]
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "powerBounds_1",
            "Guru of Marketing",
            "Increase the max revenue bounds",
            [new IdValue("minPowerBounds", 0.4)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.85, true))],
            [],
            ["maxPowerInputScore_3", "powerDecay_1"]
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "powerDecay_1",
            "Reputation I",
            "Halve the decay speed",
            [new IdValue("powerDecay", 0.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.3, true))],
            [],
            []
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            3,
            "powerDecay_2",
            "Reputation II",
            "Halve the decay speed for the last time",
            [new IdValue("powerDecay", 0.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.5, true))],
            [],
            ["powerDecay_1"]
        ));


 
        // Passive Income Tool
        this.totalUpgrades.push(new ToolUpgrade(
            9,
            "freelancerRev_1",
            "Insight I",
            "Decrease spawn time by 10 sec",
            [new IdValue("cooldown", 0.888888)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.3, true))],
            [],
            []
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            9,
            "freelancerRev_2",
            "Insight II",
            "Decrease spawn time by additional 10 sec",
            [new IdValue("cooldown", 0.875)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.6, true))],
            [],
            ["freelancerRev_1"]
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            9,
            "freelancerRev_3",
            "Insight III",
            "Decrease spawn time by final 10 sec",
            [new IdValue("cooldown", 0.857142)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.8, true))],
            [],
            ["freelancerRev_2"]
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            9,
            "freelancerCost_1",
            "Optimization I",
            "Reduce the cost",
            [new IdValue("coreCost", 0.1)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.3, true))],
            [],
            []
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            9,
            "freelancerCost_2",
            "Optimization II",
            "Reduce the cost for the last time",
            [new IdValue("coreCost", 0.1)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.85, true))],
            [],
            ["freelancerCost_1"]
        )); 

        

        // Investement Tool 
        this.totalUpgrades.push(new ToolUpgrade(
            8,
            "profit_pointCost_1",
            "Hard-Worker I",
            "Increase the prize and effort required",
            [new IdValue("campaignMaxProfit", 3), new IdValue("campaignControlPointCost", 2)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.4, true))],
            [],
            []
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            8,
            "profit_pointCost_2",
            "Hard-Worker II",
            "Maximize the prize and effort required",
            [new IdValue("campaignMaxProfit", 3), new IdValue("campaignControlPointCost", 3)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.7, true))],
            [],
            ["profit_pointCost_1"]
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            8,
            "profit_pointAmount_1",
            "Upper League",
            "Increase the prize and stage amount",
            [new IdValue("campaignMaxProfit", 3.5), new IdValue("campaignControlPoints", 1.333333)],//, new IdValue("campaignDuration", 1.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.5, true))],
            [],
            []
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            8,
            "profit_pointAmount_2",
            "Elite League",
            "Maximize the prize and stage amount",
            [new IdValue("campaignMaxProfit", 3.5), new IdValue("campaignControlPoints", 1.25)],//, new IdValue("campaignDuration", 1.5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.9, true))],
            [],
            ["profit_pointAmount_1"]
        )); 


        // Resource Exchange Tool
        this.totalUpgrades.push(new ToolUpgrade(
            10,
            "limits_1",
            "Wider Reach I",
            "Increase the exchange limits",
            [new IdValue("baseLimit", 10)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.65, true))],
            [],
            []
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            10,
            "limits_2",
            "Wider Reach II",
            "Maximize the exchange limits",
            [new IdValue("baseLimit", 10)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.85, true))],
            [],
            ["limits_1"]
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            10,
            "speed_1",
            "Commitment I",
            "Increase the exchange speed",
            [new IdValue("exchangeSpeed", 5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.55, true))],
            [],
            []
        ));
        this.totalUpgrades.push(new ToolUpgrade(
            10,
            "speed_2",
            "Commitment II",
            "Increase the exchange speed even more",
            [new IdValue("exchangeSpeed", 5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.75, true))],
            [],
            ["speed_1"]
        )); 
        this.totalUpgrades.push(new ToolUpgrade(
            10,
            "speed_3",
            "Commitment III",
            "Maximize the exchange speed",
            [new IdValue("exchangeSpeed", 5)],
            [new IdValue("money", GameManager.resourceManager.getLevelReq("money", 0.9, true))],
            [],
            ["speed_2"]
        )); 

        this.initUpgradeTemplates();
    }

    initUpgradeTemplates() {
        this.upgradeTemplates.push(new UpgradeTemplate(
            0, "charge_inf",
            "Oveclock", "Increase the Ad-Blocker gain",
            [new IdValue("spinReward", 4)],
            [new IdValue("money", 1)], 0.1,
            ["playerSpinRegenCooldown_1"]        
        ));

        this.upgradeTemplates.push(new UpgradeTemplate(
            5, "streak_inf",
            "Blockchain", "Increase generation reward",
            [new IdValue("maxReward", 4)],
            [new IdValue("money", 1)], 0.1,
            ["reward_3"]
        ));

        this.upgradeTemplates.push(new UpgradeTemplate(
            3, "bounds_inf",
            "Workaholic", "Increase the max gain",
            [new IdValue("maxPowerInputScore", 4)],
            [new IdValue("money", 1)], 0.1,
            ["maxPowerInputScore_5"]
        ));

        this.upgradeTemplates.push(new UpgradeTemplate(
            9, "passive_inf",
            "Deep Learning", "Reduce the cost",
            [new IdValue("coreCost", 0.1)],
            [new IdValue("money", 1)], 0.12,
            ["freelancerCost_2"]
        ));

        this.upgradeTemplates.push(new UpgradeTemplate(
            8, "investement_inf",
            "Sponsorship", "Increase the prize",
            [new IdValue("campaignMaxProfit", 3), new IdValue("campaignControlPointCost", 3)],
            [new IdValue("money", 1)], 0.11,
            ["profit_pointAmount_2"]
        ));

        this.upgradeTemplates.push(new UpgradeTemplate(
            10, "exchange_inf",
            "Sponsorship", "Increase the exchange limits and speed",
            [new IdValue("baseLimit", 10), new IdValue("exchangeSpeed", 5)],
            [new IdValue("money", 1)], 0.09,
            ["speed_3"]
        ));
    }

    initInfiniteUpgrades() {
        for (let template of this.upgradeTemplates) {
            this.totalUpgrades.push(template.nextUse());
            this.totalUpgrades.push(template.nextUse());
        }
    }

    addNextTemplatedUpgrade(toolId) {
        for (let template of this.upgradeTemplates) {
            if (template.toolId === toolId) {
                this.totalUpgrades.push(template.nextUse());
                break;
            }
        }
    }



    refreshUpgrades() {
        let activeUpgradeStrings = [];
        for (let upgrade of this.activeUpgrades) {
            activeUpgradeStrings.push(upgrade.id);
        }

        for (let upgrade of this.totalUpgrades) {
            if (upgrade.meetsResourceReq(GameManager.resourceManager.resources) && upgrade.meetsUpgradeReq(activeUpgradeStrings) 
                && !this.availableUpgrades.includes(upgrade) && !this.activeUpgrades.includes(upgrade)) {

                this.forceMakeUpgradeAvailable_inner(upgrade);
            }
        }
    }

    forceMakeUpgradeAvailable(upgradeId) {
        let upgrade = null;
        for (let upd of this.totalUpgrades) {
            if (upd.id == upgradeId) {
                upgrade = upd;
                break;
            }
        }
        if (upgrade == null) return;

        this.forceMakeUpgradeAvailable_inner(upgrade);
    }
    forceMakeUpgradeAvailable_inner(upgrade) {
        this.availableUpgrades.push(upgrade);
        this.broadcast_upgradeAvailable(upgrade.id);

        // GameSave
        let save_availableUpgrades = GameManager.gameSave.readProperty("availableUpgrades");
        if (!save_availableUpgrades.includes(upgrade.id)) {
            save_availableUpgrades.push(upgrade.id);
        }
        //GameManager.saveGame();
    }

    requestUpgradeUnlock(upgradeId, sourceElement) {
        let upgrade = this.availableUpgrades.find(function (element, index, array) {
            return element.id === upgradeId;
        });

        if (upgrade == undefined) return false;

        if (upgrade.meetsCost(sourceElement)) {
            for (let resourceCost of upgrade.cost) {
                GameManager.resourceManager.applyResourceChange(new IdValue(resourceCost.id, -resourceCost.value), sourceElement, false, false, AnalyticsResource.quick("upgradePurchase", GameData.getFancyToolName(upgrade.toolId) + "_" + upgrade.id));
            }

            this.forceUnlockUpgrade(upgradeId);
            this.refreshUpgrades();
            return true;
        }

        return false;
    }

    forceUnlockUpgrade(upgradeId) {
        let upgrade = this.totalUpgrades.find(function (element, index, array) {
            return element.id === upgradeId;
        });
        if (upgrade == undefined) return;

        // Stop if upgrade already active
        let activeUpgrade = this.activeUpgrades.find(function (element, index, array) {
            return element.id === upgradeId;
        });
        if (activeUpgrade != undefined) return;

        this.activeUpgrades.push(upgrade);
        this.updateToolMembers(upgrade.toolId, upgrade.memberDeltas);
        this.broadcast_upgradeActive(upgrade.id);

        // GameSave
        let save_activeUpgrades = GameManager.gameSave.readProperty("activeUpgrades");
        if (!save_activeUpgrades.includes(upgrade.id)) {
            save_activeUpgrades.push(upgrade.id);
        }
        //GameManager.saveGame();

        if (upgrade.isTemplated === true) {
            this.addNextTemplatedUpgrade(upgrade.toolId);
        }

        this.refreshUpgrades();
    }

    resetAllUpgrades() {
        this.activeUpgrades.length = 0;
        this.availableUpgrades.length = 0;

        this.refreshUpgrades();
    }

    unlockAllUpgrades() {
        for (let upgrade of this.totalUpgrades) {
            this.forceUnlockUpgrade(upgrade.id);
        }
    }

    updateToolMembers(toolId, memberDeltas) {
        let toolMembers = this.toolsMembers[toolId];
        for (let memberDelta of memberDeltas) {
            toolMembers.applyMemberMultiplier(memberDelta.id, memberDelta.value);
        }

        let tool = null;
        for (let toolCoverage of GameManager.gridInitializer.toolCoverage.tools) {
            if (toolCoverage.ownedTool.id == toolId && toolCoverage.ownedTool.toolActive) {
               for (let comp of toolCoverage.ownedTool.toolComponents) {
                   comp.membersUpdated();
               }
           }
        }
    }

    getUpgrade(upgradeId) {
        let upgrade = this.totalUpgrades.find(function (element, index, array) {
            return element.id === upgradeId;
        });
        
        if (upgrade != undefined && upgrade != null) {
            return upgrade;
        }

        return null;
    }

    updateToLoadedData() {
        // GameLoad
        let save_availableUpgrades = GameManager.gameSave.readProperty("availableUpgrades");
        let save_activeUpgrades = GameManager.gameSave.readProperty("activeUpgrades");

        for (let upgradeId of save_availableUpgrades) {
            this.forceMakeUpgradeAvailable(upgradeId)
        }
        for (let upgradeId of save_activeUpgrades) {
            this.forceUnlockUpgrade(upgradeId);
        }
    }

    // Callbacks
    addCallback_upgradeAvailable(callback) {
        if (callback == undefined || callback == null) return;
        this.upgradeAvailable_callbacks.push(callback);

        for (let upgrade of this.availableUpgrades) {
            callback(upgrade.id);
        }
    }

    addCallback_upgradeActive(callback) {
        if (callback == undefined || callback == null) return;
        this.upgradeActive_callbacks.push(callback);

        for (let upgrade of this.activeUpgrades) {
            callback(upgrade.id);
        }
    }

    broadcast_upgradeAvailable(upgradeId) {
        for (let callback of this.upgradeAvailable_callbacks) {
            if (callback == null) continue;
            callback(upgradeId);
        }
    }

    broadcast_upgradeActive(upgradeId) {
        for (let callback of this.upgradeActive_callbacks) {
            if (callback == null) continue;
            callback(upgradeId);
        }
    }
}