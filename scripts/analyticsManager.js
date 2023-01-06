class AnalyticsResource {
    constructor(flowType, currency, amount, itemType, itemId) {
        this.flowType = flowType; // enum
        this.currency = currency; // string
        this.amount = amount; // num
        this.itemType = itemType; // string
        this.itemId = itemId; // string   
    }

    setIdValue(idValue) {
        this.flowType = idValue.value >= 0 ? gameanalytics.EGAResourceFlowType.Source : gameanalytics.EGAResourceFlowType.Sink;
        this.currency = idValue.id;
        this.amount = Math.abs(idValue.value);
    }

    static quick(itemType, itemId) {
        return new AnalyticsResource(null, null, null, itemType, itemId);
    }

    toString() {
        return "flowType: " + this.flowType + " | currency: " + this.currency + " | amount: " + this.amount + " | itemType: " + this.itemType + " | itemId: " + this.itemId;
    }

    factuallyEqual(other) {
        return this.flowType == other.flowType && this.currency == other.currency && this.itemType == other.itemType && this.itemId == other.itemId;
    }
}

class AnalyticsToolUse {
    constructor(isSuccess, toolName, amount) {
        this.isSuccess = isSuccess; // bool
        this.toolName = toolName; // string
        this.amount = amount; // num 
    }

    toString() {
        return "isSuccess: " + this.isSuccess + " | toolName: " + this.toolName + " | amount: " + this.amount;
    }

    factuallyEqual(other) {
        return this.isSuccess == other.isSuccess && this.toolName == other.toolName;
    }
}

class AnalyticsManager {
    constructor(version, GDPR_agreement) {
        this.loadingFinished = false;
        this.resourceQueue = []; // AnalyticsResource[]
        this.toolUseQueue = []; // AnalyticsToolUse[]
        this.enabled = false;
        this.version = version;

        gameanalytics.GameAnalytics.configureBuild("HTML5 " + this.version);

        gameanalytics.GameAnalytics.configureAvailableResourceCurrencies(["money", "adStrike", "encryption"]);
        gameanalytics.GameAnalytics.configureAvailableResourceItemTypes(["adEncryption", "adPurge", "adSucking", "selloutRevenue", "toolReward", "toolMaintenance", "upgradePurchase", "cheat"]);
        gameanalytics.GameAnalytics.configureAvailableCustomDimensions01(["freshGame", "gameReset_01", "gameReset_02", "gameReset_03", "resets4life"]);

        this.changeGDPRAgreement(GDPR_agreement);
    }

    changeGDPRAgreement(isAgreed) {
        this.enabled = isAgreed;
        //console.log("GDPR Agreement has changed to: " + (isAgreed ? "agree" : "disagree"));
        gameanalytics.GameAnalytics.setEnabledEventSubmission(isAgreed);

        if (this.enabled === true) {
            //gameanalytics.GameAnalytics.setEnabledVerboseLog(true);
            if (GameManager.isDevBuild === false) {
                gameanalytics.GameAnalytics.setEnabledInfoLog(false);
                gameanalytics.GameAnalytics.initialize("de7db7db0100aadda25b5040d46f963f", "e643e032bcfa1a51fa624897950dd657b9d90b4a");
            }
            else {
                gameanalytics.GameAnalytics.setEnabledInfoLog(true);
                gameanalytics.GameAnalytics.initialize("3b54ad1e86e7b4efb5f8374360b73de0", "0c27a9722898ddde7a11fbe6e05765e41f96855f");
            }
        }
    }

    saveLoaded() {
        this.loadingFinished = true;
    }

    endSession() {
        gameanalytics.GameAnalytics.endSession();
    }

    sendData() {
        for (let analyticsResource of this.resourceQueue) {
            //console.log(analyticsResource.toString());
            if (analyticsResource.amount === 0) continue;
            gameanalytics.GameAnalytics.addResourceEvent(analyticsResource.flowType, analyticsResource.currency, analyticsResource.amount, analyticsResource.itemType, analyticsResource.itemId);
        } 
        this.resourceQueue.length = 0;

        for (let analyticsToolUse of this.toolUseQueue) {
            //console.log(analyticsToolUse.toString());

            let eventName = analyticsToolUse.isSuccess === true ? "ToolUse:" : "ToolFail:";
            eventName += analyticsToolUse.toolName;
            gameanalytics.GameAnalytics.addDesignEvent(eventName, analyticsToolUse.amount);
        }
        this.toolUseQueue.length = 0;
    }
    checkLoading(functionObj) {
        if (this.enabled === false) {
            return false;
            //console.log("Analytics Manager is disabled by user! (" + functionObj.name + ")");
        }
        else if (this.loadingFinished === false) {
            //console.log("Analytics Manager is not yet active! (" + functionObj.name + ")");
        }
        else if (GameManager.gameSave.readProperty("isEndlessMode") === true) {
            return false;
        }
        else {
            //console.log("NICE: Analytics Manager ready! (" + functionObj.name + ")");
        }

        return this.loadingFinished;
    }

    startLevel(levelName) {
        if (!this.checkLoading(this.startLevel)) return;
        gameanalytics.GameAnalytics.addProgressionEvent(gameanalytics.EGAProgressionStatus.Start, levelName);
    }
    completeLevel(levelName) {
        if (!this.checkLoading(this.completeLevel)) return;
        gameanalytics.GameAnalytics.addProgressionEvent(gameanalytics.EGAProgressionStatus.Complete, levelName);
    }
    failLevel(levelName) {
        if (!this.checkLoading(this.failLevel)) return;
        gameanalytics.GameAnalytics.addProgressionEvent(gameanalytics.EGAProgressionStatus.Fail, levelName);
    }

    setResetDimension(resetTimes) {
        if (this.enabled === false) return;

        // Allow pass-through
        //if (!this.checkLoading(this.setResetDimension)) return;

        switch (resetTimes) {
            case 0:
                gameanalytics.GameAnalytics.setCustomDimension01("freshGame");
                break;
            case 1:
                gameanalytics.GameAnalytics.setCustomDimension01("gameReset_01");
                break;
            case 2:
                gameanalytics.GameAnalytics.setCustomDimension01("gameReset_02");
                break;
            case 3:
                gameanalytics.GameAnalytics.setCustomDimension01("gameReset_03");
                break;
            default:
                gameanalytics.GameAnalytics.setCustomDimension01("resets4life");
                break;
        }
    }

    resourceChange(analyticsResource) {
        if (!this.checkLoading(this.resourceChange)) return;
        if (analyticsResource == null || analyticsResource == undefined) return;

        let analyticsToUse = null;
        for (let analytics of this.resourceQueue) {
            if (analyticsResource.factuallyEqual(analytics)) {
                analyticsToUse = analytics;
                break;
            }
        }

        if (analyticsToUse != null) {
            analyticsToUse.amount += analyticsResource.amount;
        }
        else {
            this.resourceQueue.push(analyticsResource);
        }
    }

    toolUsed(toolSucceded, toolName) {
        if (!this.checkLoading(this.toolUsed)) return;

        if (toolName === "Hackathon") {
            toolName = "Hackaton";
        }
        let analyticsToolUse = new AnalyticsToolUse(toolSucceded, toolName, 1);

        let analyticsToUse = null;
        for (let analytics of this.toolUseQueue) {
            if (analyticsToolUse.factuallyEqual(analytics)) {
                analyticsToUse = analytics;
                break;
            }
        }
        
        if (analyticsToUse != null) {
            analyticsToUse.amount++;
        }
        else {
            this.toolUseQueue.push(analyticsToolUse);
        }
    }

    rankAchieved(rankArray) {
        if (this.enabled === false) return;

        let resources = {};
        for (let resource of rankArray[1]) {
            resources[resource.id] = resource.value;
        }

        gameanalytics.GameAnalytics.addDesignEvent("rank:time", rankArray[0]);
        gameanalytics.GameAnalytics.addDesignEvent("rank:adPusher", rankArray[1]);
        gameanalytics.GameAnalytics.addDesignEvent("rank:money", resources["money"]);
        gameanalytics.GameAnalytics.addDesignEvent("rank:adStrike", resources["adStrike"]);
        gameanalytics.GameAnalytics.addDesignEvent("rank:encryption", resources["encryption"]);
        gameanalytics.GameAnalytics.addDesignEvent("rank:letterScore", HighScores.getRankScores(rankArray[0], rankArray[1]).average);
    }
}