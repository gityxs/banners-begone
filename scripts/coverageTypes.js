class Vector2 {

    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.add        = this.add.bind(this);
        this.sub        = this.sub.bind(this);
        this.mult       = this.mult.bind(this);
        this.div        = this.div.bind(this);
    }

    add(vec) {
        return new Vector2(this.x + vec.x, this.y + vec.y);
    }

    sub(vec) {
        return new Vector2(this.x - vec.x, this.y - vec.y);
    }

    mult(vec) {
        return new Vector2(this.x * vec.x, this.y * vec.y);
    }

    div(vec) {
        return new Vector2(this.x / vec.x, this.y / vec.y);
    }

    mult_num(num) {
        return new Vector2(this.x * num, this.y * num);
    }

    div_num(num) {
        return new Vector2(this.x / num, this.y / num);
    }

    equals(vec) {
        return this.x === vec.x && this.y === vec.y;
    }

    distance(target) {
        let x = Math.abs(target.x - this.x);
        let y = Math.abs(target.y - this.y);
        let distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        return distance;
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    normalize() {
        var length = this.length();
        if (length > 0) {
            return this.div_num(length);
        }
        return new Vector2(0, 0);
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    getCompass() {
        let angle = Math.atan2(this.y, this.x);
        let octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;

        let headings = ["W", "NW", "N", "NE", "E", "SE", "S", "SW"];
        return headings[octant];
    }
}

class AdGenOptions {
    constructor(difficulty, adAmount) {
        this.difficulty = difficulty;
        this.adAmount = adAmount;
    }
}

class MainGridElement {

    constructor(gridBounds) {
        this.id = -1;
        this.gridBounds = [new Vector2(gridBounds[0], gridBounds[1]), new Vector2(gridBounds[2], gridBounds[3])]; // Vector2[2]

        this.layoutElement = null // DOMElement
        this.interactionElement = null // DOMElement

        this.setId              = this.setId.bind(this);
        this.constructElement   = this.constructElement.bind(this);
        this.tick               = this.tick.bind(this);
        this.activate           = this.activate.bind(this);
    }

    setId(id) {
        this.id = id;
    }

    constructElement() {
        this.interactionElement = document.createElement("div");
        this.interactionElement.classList.add("mainGridElement");

        this.layoutElement = document.createElement("div");
        this.layoutElement.classList.add("mainGridElementContainer");
        this.layoutElement.setAttribute("gameplay_id", this.id);
        this.layoutElement.setAttribute("oncontextmenu", "return false;");
        this.layoutElement.appendChild(this.interactionElement);

        return this.layoutElement;
    }

    tick(deltaTime) {
    }

    activate() {
    }
}

class ToolGridElement extends MainGridElement {

    constructor(gridBounds, ownedTool, adGenOptions, resourceRoles) {
        super(gridBounds);

        this.ownedTool = ownedTool;
        this.adGenOptions = adGenOptions; // AdGenOptions
        this.coveringAd = null; // AdCover
        this.isLocked = true;
        this.isCoveringAdFrozen = false;

        this.resourceRoles = resourceRoles; // String[]
        this.lockedTool = null;

        this.setCoveringAd          = this.setCoveringAd.bind(this);
        this.coveringAdDestroyed    = this.coveringAdDestroyed.bind(this);
        this.setLockedState         = this.setLockedState.bind(this);
        this.coveringAdFreezeState  = this.coveringAdFreezeState.bind(this);
        this.createLockedTool       = this.createLockedTool.bind(this);

    }

    tick(deltaTime) {
        this.ownedTool.tick(deltaTime);
        this.lockedTool.tick(deltaTime);
    }

    setId(id) {
        super.setId(id);
        this.ownedTool.coverId = id;
    }

    activate() {
        this.createLockedTool();
    }

    setCoveringAd(coveringAd) {
        if (coveringAd != null && coveringAd != undefined && this.ownedTool.id == 6) {
            this.coveringAd = coveringAd;
            this.coveringAd.purgeCallbacks.push(this.coveringAdDestroyed);
            this.coveringAd.freezeCallbacks.push(this.coveringAdFreezeState);

            this.setLockedState(true);
        }
        else {
            if (this.coveringAd != null && this.coveringAd != undefined && this.ownedTool.id == 6) {
                FunLib.removeFromArray(this.coveringAd.purgeCallbacks, this.coveringAdDestroyed);
                FunLib.removeFromArray(this.coveringAd.freezeCallbacks, this.coveringAdFreezeState);
            }
            this.coveringAd = null;

            this.setLockedState(false);
        }
    }

    setLockedState(isLocked) {
        let lastLocked = this.isLocked;
        this.isLocked = isLocked;

        if (this.isLocked) {
            this.ownedTool.deactivate();

            if (this.lockedTool != null) {
                this.lockedTool.toolComponents[0].lockedTool = this.ownedTool;
                this.lockedTool.activate(this.interactionElement);
                this.lockedTool.toolComponents[0].setAdditionalLock(true);
            }
        }
        else if (lastLocked != this.isLocked) {
            this.lockedTool.deactivate();

            this.ownedTool.activate(this.interactionElement);
        }
    }

    coveringAdDestroyed(ad) {
        this.setCoveringAd(null);
        /*if (this.isLocked) {
            this.setLockedState(false);
        }*/
    }

    coveringAdFreezeState(ad, freezeState) {
        this.isCoveringAdFrozen = freezeState;
        this.lockedTool.toolComponents[0].setAdditionalLock(!freezeState);
    }

    createLockedTool() {
        this.lockedTool = GameData.constructTool(100, function (gridElement, inputScore, resourceIdValue) { GameManager.progressionRequest(gridElement, inputScore, resourceIdValue); }, [this.resourceRoles, this.ownedTool.id]);
    }
}

class AdCover extends MainGridElement {

    constructor(gridBounds, growDirection, adDifficulty) {
        super(gridBounds);

        this.headerText = ""; //headerText; // String
        this.bodyText = ""; //bodyText; // String
        this.growDirection = growDirection; // Vector2
        this.growSpeed = 1.0; // num

        this.invulnerable = false;

        if (Array.isArray(adDifficulty)) {
            this.adDifficulty = adDifficulty; // float[3]
        }
        else {
            this.adDifficulty = [adDifficulty, adDifficulty, adDifficulty]; // float[3]
            if (adDifficulty < 0) {
                this.invulnerable = true;
            }
        }

        this.maxPow = 50;

        this.initialBorderWidth = 6;

        this.purgeCost_min = 200;
        this.purgeCost_growthRate = 1.23;

        this.clickRequirementPow_min = 1.1;
        this.clickRequirementPow_growthRate = 1.06;

        this.maxEncryptionScore_min = 30;
        this.maxEncryptionScore_growthRate = 1.14;

        this.growProgress = 1.0;
        this.growTimerHandle = new TimerHandle(-1);
        this.purgeCallbacks = [];
        this.freezeCallbacks = [];
        this.encryptCallback = null;
        this.purgeNotifies = [];

        this.encryptionScore = 0.0;

        this.minFreezeTime = 2.0;
        this.maxFreezeTime = 10.0;
        this.freezeTimerHandle = new TimerHandle(-1);
        this.adFrozen = false;
        this.greezeProtection = false;

        this.purgeCostReductionHandle = new TimerHandle(-1);
        this.growOvershootHandle = new TimerHandle(-1);
        this.shouldFinishSelfPurging = true;

        this.isBeingEncypted = false;
        this.encryptTime = 0.0;

        this.lifetime = 0;
        this.costRegrowthTime = 20;

        this.isSucking = false;

        this.unfrozenBorderColor = [255, 255, 255];
        this.frozenBorderColor = [50, 50, 255];
        this.cosmeticClasses = [];

        if (this.adDifficulty[0] >= 0) {
            this.purgeCost = this.generateLevelReq(this.purgeCost_min, this.purgeCost_growthRate, this.adDifficulty[0], true); // int
        } else if (this.adDifficulty[0] < 0) {
            this.purgeCost = Infinity;
        } else {
            this.purgeCost = 0;
        }
        this.maxPurgeCost = this.purgeCost;

        if (this.adDifficulty[1] >= 0) {
            this.clickRequirement = this.generateLevelReq(this.clickRequirementPow_min, this.clickRequirementPow_growthRate, this.adDifficulty[1], false); // int
        } else if (this.adDifficulty[1] < 0) {
            this.clickRequirement = Infinity;
        } else {
            this.clickRequirement = 0.9;
        }

        if (this.adDifficulty[2] >= 0) {
            this.maxEncryptionScore = this.generateLevelReq(this.maxEncryptionScore_min, this.maxEncryptionScore_growthRate, this.adDifficulty[2], true); // float?
        } else if (this.adDifficulty[2] < 0) {
            this.maxEncryptionScore = Infinity;
        } else {
            this.maxEncryptionScore = this.maxEncryptionScore_min;
        }

        this.cachedPurgeCostOffset = 0;

        // this.stickyDiv = null;
        this.regrowAnimationClass = "";
        this.frozenPushAnimationClass = "";

        this.clickDiscardFraction = 0.25;
        this.stickyBorderOffset = 0;
        this.isBossPart = false;
        this.adSaveData = null;

        this.adPurgeCost = null;
        this.adPurgeButton = null;
        this.adPurgeX = null;
        this.adEncrypt_progress = null;
        this.adEncryptScore = null;
        this.adEncryptV = null;
        this.adCoverImg = null;
        this.adInteraction = null;
         this.adEncryptButton = null;

        this.markedForPurge = false;

        this.encryptionRing = null;

        this.windowResizeCached = false;

        this.layoutBoundingRect = new DOMRect();
        this.interactionBoundingRect = new DOMRect();

        this.adStrikeFormattingTier = 1;
        this.encryptionFormattingTier = 1;

        this.generateLevelReq       = this.generateLevelReq.bind(this);
        this.setGrowOrigin          = this.setGrowOrigin.bind(this);
        this.setGrow                = this.setGrow.bind(this);
        this.animateGrow            = this.animateGrow.bind(this);
        this.requestPurge           = this.requestPurge.bind(this);
        this.requestEncrypt_once    = this.requestEncrypt_once.bind(this);
        this.requestEncrypt_start   = this.requestEncrypt_start.bind(this);
        this.requestEncrypt_stop    = this.requestEncrypt_stop.bind(this);
        this.getEncryptionMultiplier = this.getEncryptionMultiplier.bind(this);

        this.freezeAd               = this.freezeAd.bind(this);
        this.unfreezeAd             = this.unfreezeAd.bind(this);
        this.getFreezeTime          = this.getFreezeTime.bind(this);
        this.getExpGrowSpeed        = this.getExpGrowSpeed.bind(this);
        this.animateAdFreeze        = this.animateAdFreeze.bind(this);

        this.setAdImage             = this.setAdImage.bind(this);
        this.resourceChanged        = this.resourceChanged.bind(this);
        this.finishAdPurging        = this.finishAdPurging.bind(this);

        this.animationFinished      = this.animationFinished.bind(this);

        this.windowResized = this.windowResized.bind(this);
    }

    activate() {
        GameManager.globalEventListener.addGlobalListener("resize", this.windowResized);
        GameManager.resourceManager.add_resourceChangedCallback(this.resourceChanged.bind(this));
        this.interactionElement.addEventListener("animationend", this.animationFinished);
        this.interactionElement.addEventListener("animationcancel", this.animationFinished);
    }

    setIsBossPart(state) {
        this.isBossPart = state;

        let saveData = GameManager.gameSave.readProperty("adsData")[this.id];
        if (saveData != undefined && saveData != null) {
            // GameSave
            GameManager.gameSave.readProperty("adsData")[this.id].isBossPart = this.isBossPart;
        }
    }

    windowResized(e) {
        this.layoutBoundingRect = this.layoutElement.getBoundingClientRect();
        this.interactionBoundingRect = this.interactionElement.getBoundingClientRect();

        if (this.growProgress == 1) {
            this.setAdImage(this.imgSrc);
        }
        else {
            this.windowResizeCached = true;
        }
    }

    generateLevelReq(base, growthRate, difficulty, prettify) {
        let pow = FunLib.lerpNumber(difficulty, 0, this.maxPow);
        let result = base * Math.pow(growthRate, pow);
        if (prettify) {
            result = FunLib.prettifyExpNum(result, base, 3);
        }

        return result;
    }

    generateBorderColor() {
        let availableColors = [
            [221, 199, 251],
            [203, 135, 251],
            [173, 166, 251],
            [153, 140, 231],
            [163, 132, 218],
            [169, 148, 226]
        ];

        let color = availableColors[this.id % availableColors.length];
        return color;
    }

    getSaveData() {
        // GameSave
        if (this.adSaveData == null) {
            if (!(this instanceof BossAdCover)) {
                if (this.isBossPart) {
                    this.adSaveData = null;
                }
                else {
                    this.adSaveData = GameManager.gameSave.readProperty("adsData")[this.id];
                }
            }
            else {
                this.adSaveData = GameManager.gameSave.readProperty("bossData").adData;
            }
        }

        return this.adSaveData;
    }

    applyCachedPurgeCostOffsetChange(delta) {
        if (delta == null || delta == undefined) return;
        this.cachedPurgeCostOffset += delta;

        // GameSave
        if (this.getSaveData() != null) {
            this.getSaveData().cachedPurgeCostOffset = this.cachedPurgeCostOffset;
        }

        this.changePurgeCost(true);
    }

    constructElement() {
        let endlessModeEnabled = this.adDifficulty[0] < 0 && GameManager.gameSave.readProperty("bossDefeatedTimes") > 0;

        this.adPurgeButton = document.createElement("button");
        this.adPurgeButton.classList.add("adPurgeButton");
        this.adPurgeButton.classList.add("ad");
        this.adPurgeButton.insertAdjacentHTML('beforeend', '\
            <p class="adPurgeX">[BLOCK]</p>\
            <p class="adPurgeCost">' + this.getString_purgeCost() + '</p>\
            ');
        this.adPurgeButton.addEventListener("click", this.requestPurge);
        this.adPurgeCost = this.adPurgeButton.querySelector(".adPurgeCost");
        this.adPurgeX = this.adPurgeButton.querySelector(".adPurgeX");

         this.adEncryptButton = document.createElement("button");
         this.adEncryptButton.classList.add("adEncryptButton");
         this.adEncryptButton.classList.add("ad");
         this.adEncryptButton.insertAdjacentHTML('beforeend', '\
            <div class="adEncrypt_progress"></div>\
            <p class="adEncryptV">[0% DISCOUNT]</p>\
            <p class="adEncryptScore">' + this.getString_maxEncryption() +  '</p>\
            ');
         this.adEncryptButton.addEventListener("mousedown", this.requestEncrypt_start);
         this.adEncryptButton.addEventListener("mouseup", this.requestEncrypt_stop);
         this.adEncryptButton.addEventListener("mouseleave", this.requestEncrypt_stop);
        this.adEncrypt_progress =   this.adEncryptButton.querySelector(".adEncrypt_progress");
        this.adEncryptScore =   this.adEncryptButton.querySelector(".adEncryptScore");
        this.adEncryptV =   this.adEncryptButton.querySelector(".adEncryptV");

        let endlessButton = document.createElement("button");
        if (endlessModeEnabled) {
            endlessButton.classList.add("adEndlessButton", "ad");

            endlessButton.insertAdjacentHTML('beforeend', '\
                <p>ENDLESS<br>MODE</p>\
            ');
            endlessButton.addEventListener("click", GameManager.requestEndlessMode.bind(GameManager));
        }

        this.adInteraction = document.createElement("div");
        this.adInteraction.classList.add("adInteraction");
        if (endlessModeEnabled) {
            this.adInteraction.append(this.adPurgeButton, endlessButton);
        }
        else {
            this.adInteraction.append(this.adPurgeButton,   this.adEncryptButton);
        }

        this.interactionElement = document.createElement("div");
        this.interactionElement.classList.add("adCover");
        this.interactionElement.classList.remove("adPurgeAnimation");
        this.interactionElement.append(this.adInteraction);

        this.unfrozenBorderColor = this.generateBorderColor();
        this.interactionElement.style["border-color"] = FunLib.getColorString(this.unfrozenBorderColor);
        this.interactionElement.style["background-color"] = FunLib.getColorString(this.unfrozenBorderColor);

        this.layoutElement = document.createElement("div");
        this.layoutElement.classList.add("adCoverElementContainer");
        this.layoutElement.setAttribute("gameplay_id", this.id);
        this.layoutElement.setAttribute("oncontextmenu", "return false;");
        this.layoutElement.append(this.interactionElement); // , this.stickyDiv);

        this.setGrowOrigin(this.growDirection);
        this.interactionElement.addEventListener("click", this.unfreezeAd);

        return this.layoutElement;
    }

    setGrowOrigin(growDirection) {
        this.growDirection = growDirection;

        if (this.growDirection.x > 0) {
            this.interactionElement.style["left"] = "0";

            this.regrowAnimationClass = "adRegrowAnimation_right";
            this.frozenPushAnimationClass = "adAlreadyFrozenAnimation_left";
        }
        else if (this.growDirection.x < 0) {
            this.interactionElement.style["right"] = "0";

            this.regrowAnimationClass = "adRegrowAnimation_left";
            this.frozenPushAnimationClass = "adAlreadyFrozenAnimation_right";
        }

        if (this.growDirection.y > 0) {
            this.interactionElement.style["top"] = "0";

            this.regrowAnimationClass = "adRegrowAnimation_up";
            this.frozenPushAnimationClass = "adAlreadyFrozenAnimation_down";
        }
        else if (this.growDirection.y < 0) {
            this.interactionElement.style["bottom"] = "0";

            this.regrowAnimationClass = "adRegrowAnimation_down";
            this.frozenPushAnimationClass = "adAlreadyFrozenAnimation_up";
        }

        this.layoutBoundingRect = this.layoutElement.getBoundingClientRect();
    }

    setGrow(growProgress) {
        if (this.growProgress == growProgress) return;
        let lastGrowProgress = this.growProgress;
        this.growProgress = FunLib.clamp(growProgress, 0.0, growProgress);

        let layoutRect = this.layoutBoundingRect;

        if (this.growDirection.x != 0) {
            let xGrow = this.growProgress * Math.ceil(Math.abs(this.growDirection.x)) * 100;
            this.interactionElement.style["width"] = xGrow + "%";
        }
        if (this.growDirection.y != 0) {
            let yGrow = this.growProgress * Math.ceil(Math.abs(this.growDirection.y)) * 100;
            this.interactionElement.style["height"] = yGrow + "%";
        }

        if (lastGrowProgress < 1.0 && this.growProgress === 1) {
            this.addCosmeticClass(this.regrowAnimationClass);

            this.updatePurgeHighlight(GameManager.resourceManager.getResourceValue("adStrike"));

            // workaround for iframe not updating mouse events when ad grows over mouse position
            // essentially disables holding Suprise Mechanic through the ad
            for (let tool of GameManager.gridInitializer.gridManager.getToolsInBounds(this.gridBounds)) {
                if (tool.ownedTool.id != 11) continue;
                tool.ownedTool.toolComponents[0].cancelHold();
            }
        }
    }

    offsetGrow(growOffset) {
        if (this.freezeProtection) return;
        if (Math.abs(growOffset) < this.clickRequirement * this.clickDiscardFraction) return;

        this.removeCosmeticClass(this.regrowAnimationClass);

        this.layoutBoundingRect = this.layoutElement.getBoundingClientRect();
        this.setGrow(this.growProgress + growOffset / this.clickRequirement);

        if (this.growProgress <= 0) {
            this.freezeAd();
        }
    }

    animateGrow(initialGrow, finalGrow, duration) {
        TimerManager.removeTimer(this.growTimerHandle);

        let adCover = this;
        this.growTimerHandle = TimerManager.setTimer(duration, null, function (lifespan, lifetime) {
            let alpha = lifetime / lifespan;
            adCover.setGrow((finalGrow - initialGrow) * alpha + initialGrow);
        });
    }

    tick(deltaTime) {


        if (!this.adFrozen && !TimerManager.isTimerActive(this.growOvershootHandle)) {
            this.setGrow(FunLib.clamp(this.growProgress + this.getExpGrowSpeed() * deltaTime, 0, 1));
        }

        if (this.invulnerable === true) {
            return;
        }
        if (this.isBeingEncypted && this.encryptionScore < this.maxEncryptionScore) {
            this.encryptTime += deltaTime;

            if (this.encryptTime >= 0.2) {
                GlobalAnimations.stopProgressRing(this.encryptionRing);

                let resourceValue = Math.ceil(Math.pow(5, (1 + this.encryptTime) * FunLib.clamp(2 + this.maxEncryptionScore / 1500 * 1.375, 2, 4))) * deltaTime;

                if (this.encryptionScore + resourceValue > this.maxEncryptionScore) {
                    resourceValue = this.maxEncryptionScore - this.encryptionScore;
                }

                if (GameManager.resourceManager.getResourceValue("encryption") <= 0.0) {
                    GameManager.resourceManager.displayResourceInsufficient("encryption", this.interactionElement);
                    this.requestEncrypt_stop(null);
                    return;
                }
                if (GameManager.resourceManager.getResourceValue("encryption") < resourceValue) {
                    resourceValue = GameManager.resourceManager.getResourceValue("encryption");
                }

                this.addEncryption(resourceValue);
                GameManager.resourceManager.applyResourceChange(new IdValue("encryption", -resourceValue), this.interactionElement, true, false, AnalyticsResource.quick("adEncryption", "adId_" + this.id));
            }
        }

        if (this.growProgress == 1 && this.windowResizeCached === true) {
            this.setAdImage(this.imgSrc);
            this.windowResizeCached = false
        }
    }

    requestPurge(e, bypassResourceCheck, instant) {
        if (this.markedForPurge === true) return;

        if (bypassResourceCheck == null || bypassResourceCheck == undefined || !bypassResourceCheck) {
            let resourceValue = GameManager.resourceManager.getResourceValue("adStrike");

            if (resourceValue == undefined || resourceValue < this.purgeCost) {
                GameManager.resourceManager.displayResourceInsufficient("adStrike", this.interactionElement);
                return;
            }
        }

        this.markedForPurge = true;

        if (this.shouldFinishSelfPurging === true) {
            if (instant === true) {
                this.finishAdPurging(bypassResourceCheck);
            }
            else {
                this.interactionElement.classList.add("adPurgeAnimation");
                this.shakeMainGrid(false);
                TimerManager.setTimer(0.25, function () { this.finishAdPurging(bypassResourceCheck); }.bind(this));
            }
        }

        for (let purgeNotify of this.purgeNotifies) {
            purgeNotify(this);
        }
    }
    finishAdPurging(bypassResourceCheck) {
        if (bypassResourceCheck == null || bypassResourceCheck == undefined || !bypassResourceCheck) {
            GameManager.resourceManager.applyResourceChange(new IdValue("adStrike", -this.purgeCost), this.interactionElement, false, false, AnalyticsResource.quick("adPurge", "adId_" + this.id));
        }
        for (let callback of this.purgeCallbacks) {
            callback(this);
        }

        GameManager.globalEventListener.removeGlobalListener("resize", this.windowResized);
    }

    requestEncrypt_once() {
    }

    requestEncrypt_start(e) {
        if (this.invulnerable === true) {
            GameManager.resourceManager.displayResourceInsufficient("encryption", this.interactionElement);
            return;
        }

        if (GameManager.resourceManager.getResourceValue("encryption") < 1.0) {
            GameManager.resourceManager.displayResourceInsufficient("encryption", this.interactionElement);
            return;
        }

        this.isBeingEncypted = true;
        this.encryptionRing = GlobalAnimations.animateProgressRing(0.2, new Vector2(e.clientX, e.clientY));
    }

    requestEncrypt_stop(e) {
        GlobalAnimations.stopProgressRing(this.encryptionRing);

        if (this.invulnerable === true) {
            return;
        }

        if (!this.isBeingEncypted) return;

        if (this.encryptTime < 0.2) {
            if (this.encryptionScore >= this.maxEncryptionScore) return;
            if (GameManager.resourceManager.getResourceValue("encryption") < 1.0) {
                GameManager.resourceManager.displayResourceInsufficient("encryption", this.interactionElement);
                return;
            }

            this.addEncryption(1.0);
            GameManager.resourceManager.applyResourceChange(new IdValue("encryption", -1.0), this.interactionElement, false, false, AnalyticsResource.quick("adEncryption", "adId_" + this.id));
        }

        this.isBeingEncypted = false;
        this.encryptTime = 0.0;

        // GameSave
        if (this.getSaveData() != null) {
            this.getSaveData().encryption = this.encryptionScore;
            //GameManager.saveGame();
        }
    }

    addEncryption(encryption) {
        if (this.encryptionScore + encryption > this.maxEncryptionScore) {
            encryption = this.maxEncryptionScore - this.encryptionScore;
            this.encryptionScore = this.maxEncryptionScore;
        }
        else {
            this.encryptionScore = FunLib.clamp(this.encryptionScore + encryption, 0.0, this.maxEncryptionScore);
        }

        let maxString = "% DISCOUNT]";
        if (this.encryptionScore >= this.maxEncryptionScore) {
            maxString = "% DISCOUNT]";
        }
        let valueText = this.getString_maxEncryption();

        this.adEncryptScore.innerHTML = valueText;
        //this.adEncryptV.textContent = percentText;
        this.adEncrypt_progress.style["width"] = (this.encryptionScore / this.maxEncryptionScore * 100) + "%";

        this.changePurgeCost(true);

        if (this.encryptCallback != null && this.encryptCallback != undefined) {
            this.encryptCallback(this, encryption);
        }
    }

    changePurgeCost(showVisuals) {
        if (this.invulnerable === true) {
            this.purgeCost = Infinity;
            this.adPurgeCost.innerHTML = this.getString_purgeCost();
            return;
        }

        let newPurgeCost = Math.floor(this.generateLevelReq(this.purgeCost_min, this.purgeCost_growthRate, this.adDifficulty[0], true) * FunLib.lerpNumber(this.getEncryptionMultiplier(), 1.0, 0.5));
        this.purgeCost = Math.round(FunLib.clamp(newPurgeCost + this.cachedPurgeCostOffset, 0, this.maxPurgeCost));
        this.adPurgeCost.innerHTML = this.getString_purgeCost();

        TimerManager.removeTimer(this.purgeCostReductionHandle);
        let purgeButton = this.adPurgeButton;

        if (showVisuals === true) {
            purgeButton.classList.remove("ad_flash_blue");
            void purgeButton.offsetHeight;
            purgeButton.classList.add("ad_flash_blue");

            this.purgeCostReductionHandle = TimerManager.setTimer(0.2, function () { if (purgeButton != null && purgeButton != undefined) { purgeButton.classList.remove("ad_flash_blue"); } }.bind(this));
        }
        this.resourceChanged(new IdValue("adStrike", GameManager.resourceManager.getResourceValue("adStrike")));

        this.updatePurgeHighlight(GameManager.resourceManager.getResourceValue("adStrike"));

        let costReductionFraction = 1 - (this.purgeCost / this.generateLevelReq(this.purgeCost_min, this.purgeCost_growthRate, this.adDifficulty[0], true));
        let percentText = "[" + Math.ceil(costReductionFraction * 100) + "% DISCOUNT]";
        this.adEncryptV.textContent = percentText;
    }

    getEncryptionMultiplier() {
        return this.encryptionScore / this.maxEncryptionScore;// * 0.9;
    }


    addCosmeticClass(className) {
        this.interactionElement.classList.add(className);
        this.cosmeticClasses.push(className);
    }
    removeCosmeticClass(className) {
        this.interactionElement.classList.remove(className);
        FunLib.removeFromArray(this.cosmeticClasses, className);
    }
    freezeAd() {
        if (this.freezeProtection) return;
        let alreadyFrozen = this.adFrozen;

        void this.interactionElement.offsetHeight;

        this.adFrozen = true;

        TimerManager.removeTimer(this.freezeTimerHandle);
        this.freezeTimerHandle = TimerManager.setTimer(this.getFreezeTime(), this.unfreezeAd, this.animateAdFreeze);

        for (let callback of this.freezeCallbacks) {
            callback(this, this.adFrozen);
        }

        this.interactionElement.style["border-color"] = FunLib.getColorString(this.frozenBorderColor);
        this.interactionElement.style["border-style"] = "solid";
        this.interactionElement.style["cursor"] = "pointer";

        for (let cosmeticClass of this.cosmeticClasses) {
            this.interactionElement.classList.remove(cosmeticClass);
        }

        if (alreadyFrozen) {
            this.addCosmeticClass(this.frozenPushAnimationClass);
        }
    }

    animateAdFreeze(lifespan, lifetime) {
        let progression = lifetime / lifespan;
        let newColor = FunLib.getColorString(FunLib.lerpColor(progression, this.frozenBorderColor, this.unfrozenBorderColor));
        this.interactionElement.style["border-color"] = newColor;
        this.interactionElement.style["background-color"] = newColor;

        if (this.growDirection.x != 0) {
            this.interactionElement.style["height"] = (progression * 90 + 10) + "%";
        }
        else if (this.growDirection.y != 0) {
            this.interactionElement.style["width"] = (progression * 90 + 10) + "%";
        }
    }

    unfreezeAd() {
        this.animateAdFreeze(1, 1);
        this.adFrozen = false;
        TimerManager.removeTimer(this.freezeTimerHandle);

        for (let callback of this.freezeCallbacks) {
            callback(this, this.adFrozen);
        }

        this.interactionElement.style["border-style"] = "ridge";
        this.interactionElement.style["cursor"] = "auto";

        for (let cosmeticClass of this.cosmeticClasses) {
            this.interactionElement.classList.add(cosmeticClass);
        }

        this.removeCosmeticClass(this.frozenPushAnimationClass);
    }

    getFreezeTime() {
        if (this.invulnerable === true) {
            return 0;
        }

        let time = FunLib.lerpNumber(this.getEncryptionMultiplier(), this.minFreezeTime, this.maxFreezeTime);
        return Math.round(time * 100) / 100;
    }

    getExpGrowSpeed() {
        if (this.growProgress < 0.5) {
            return FunLib.lerpNumber(this.growProgress * 2, this.growSpeed * 0.1, this.growSpeed * 2);
        }
        else {
            return FunLib.lerpNumber((this.growProgress - 0.5) * 2, this.growSpeed * 2, this.growSpeed * 4);
        }
    }



    setAdImage(fileString) {
        if (fileString == null || fileString == undefined) {
            fileString = "ads/" + Math.abs(this.gridBounds[0].x - this.gridBounds[1].x) + "x" + Math.abs(this.gridBounds[0].y - this.gridBounds[1].y) + "/";
            let index = this.id % 3 + 1;
            fileString += index + ".png";
        }

        if (this.adCoverImg == null || this.adCoverImg == undefined) {
            this.adCoverImg = document.createElement("img");
            this.interactionElement.appendChild(this.adCoverImg);
        }
        this.adCoverImg.classList.add("adCoverImg");
        this.imgSrc = fileString;
        this.adCoverImg.src = fileString;
        void this.adCoverImg.offsetHeight;

        this.interactionBoundingRect = this.interactionElement.getBoundingClientRect();
        let border = this.initialBorderWidth * 2;
        let width = this.interactionBoundingRect.width - border;
        let height = this.interactionBoundingRect.height - border;

        this.adCoverImg.width = width;
        this.adCoverImg.height = height;
        this.adCoverImg.style["width"] = width + "px";
        this.adCoverImg.style["height"] = height + "px";

        this.adCoverImg.addEventListener("click", this.clickedAdImage.bind(this));

        return fileString;
    }

    resourceChanged(idValue) {
        if (idValue.id == "adStrike") {
            this.updatePurgeHighlight(idValue.value);
        }
    }

    stripInteractionButtons() {
        this.adInteraction.classList.add("hidden");
    }

    shakeMainGrid(severeShake) {
        if (this.isDefeated) return;

        this.layoutElement.parentNode.classList.remove("mainGridShake", "mainGridShakeSevere", "mainGridShakeAbsolute");
        this.layoutElement.parentNode.offsetHeight;

        if (severeShake) {
            this.layoutElement.parentNode.classList.add("mainGridShakeSevere");
        }
        else {
            this.layoutElement.parentNode.classList.add("mainGridShake");
        }
    }

    updatePurgeHighlight(purgeResourceValue) {
        if (purgeResourceValue == null || purgeResourceValue == undefined) return;
        if (this.adPurgeButton == null || this.adPurgeButton == undefined) return;

        if (purgeResourceValue >= this.purgeCost && this.growProgress >= 1) {
            this.adPurgeButton.classList.add("adPurgeButtonFlash");
        }
        else {
            this.adPurgeButton.classList.remove("adPurgeButtonFlash");
        }
    }

    clickedAdImage() {
        let bounds = this.interactionElement.parentNode.style["grid-area"];
        let resourceText = 'https://...';

        let popup = document.createElement("div");
        popup.classList.add("linkLockedPopup");
        popup.insertAdjacentHTML('beforeend', '\
                <p>' + resourceText + '</p>\
                ');

        //popup.style["animation-duration"] = 2 + "s";

        let wrapper = document.createElement("div");
        wrapper.classList.add("linkLockedPopupWrapper");
        wrapper.style["grid-area"] = bounds;
        wrapper.append(popup);

        TimerManager.setTimer(parseFloat(popup.style["animation-duration"]), function () { ResourceManager.removeResourcePopup(wrapper); });
        document.getElementById("mainGridContainer").appendChild(wrapper);
    }

    animationFinished(e) {
        if (e.animationName.includes("ad_regrow_animation")) {
            this.removeCosmeticClass(this.regrowAnimationClass);
        }
        else if (e.animationName.includes("ad_alreadyFrozen_animation")) {
            this.removeCosmeticClass(this.frozenPushAnimationClass);
        }
    }

    setFreezeTimes(min, max) {
        this.minFreezeTime = min;
        this.maxFreezeTime = max;
        this.addEncryption(0);
    }

    getString_purgeCost() {
        if (isFinite(this.purgeCost)) {
            let baseCost = this.generateLevelReq(this.purgeCost_min, this.purgeCost_growthRate, this.adDifficulty[0], true);
            if (this.purgeCost < baseCost) {
                return '<mark class="strikethrough">' + ResourceManager.formatResource(baseCost, this.adStrikeFormattingTier) + '</mark> ' + ResourceManager.formatResource(this.purgeCost, this.adStrikeFormattingTier) + ' ' + SymbolDatabase.getSymbol("adStrike");
            }
            else {
                return ResourceManager.formatResource(this.purgeCost, this.adStrikeFormattingTier) + ' ' + SymbolDatabase.getSymbol("adStrike");
            }
        }

        return "ụ̴͚͑ ̸̳̿ ̷͉̥͒̅ ̵͉͉͂K̷̝͊͜ ̸͉͎͝i̸̧̥̋̕_̶̱͜͠=̵̙͈̓ ̵̝̭̂̍n̸̜̙̿"
    }
    getString_maxEncryption() {
        if (isFinite(this.maxEncryptionScore)) {
            return ResourceManager.formatResource(Math.floor(this.encryptionScore), this.encryptionFormattingTier) + "/" + ResourceManager.formatResource(this.maxEncryptionScore, this.encryptionFormattingTier) + " " + SymbolDatabase.getSymbol("encryption");
        }

        return "Ē̶̡̦͘=̶̹̾̔ͅp̴̐ͅ_̸̨͉̍)̶̙͙̈r̴̯̕͝";
    }
}


class AdDataMinimum {
    constructor(gridBounds, growDirection, adDifficulty, adCover, spawnsInitially, destroyedTreshold) {
        this.gridBounds = gridBounds; // [4]
        this.growDirection = growDirection; // Vector2
        this.adDifficulty = adDifficulty; // [3] - purge, click, encryption
        this.isPurged = false;
        this.spawnsInitially = spawnsInitially;
        this.isHinted = false;
        this.spawnHint = null;
        this.spawnHintHandle = new TimerHandle(-1);
        this.coverId = -1;

        if (destroyedTreshold != undefined && destroyedTreshold != null) {
            this.destroyedTreshold = destroyedTreshold;
        }
        else {
            this.destroyedTreshold = 0;
        }

        this.adCover = null; // AdCover
        if (adCover instanceof AdCover) {
            this.adCover = adCover;
        }

        this.isStructure = false; // bool
        this.blacklistTimerHandle = null;
        this.spawnGrowTimerHandle = null;
    }

    boundsEqual(gridBounds) {
        return (
            this.gridBounds[0] === gridBounds[0].x
            && this.gridBounds[1] === gridBounds[0].y
            && this.gridBounds[2] === gridBounds[1].x
            && this.gridBounds[3] === gridBounds[1].y);
    }
}

class BossAdStructure {
    constructor(root, children) {
        this.root = root; // AdDataMinimum
        this.children = children; // AdDataMinimum[]

        this.root.isStructure = true;
        for (let child of this.children) {
            child.isStructure = false;
        }
    }
}

class BossAdCover extends AdCover {
    constructor(gridBounds, adCoverage, difficultyOverride) {
        let difficulty = [1.5, 2, 0.95];
        if (difficultyOverride != null && difficultyOverride != undefined) {
            difficulty = difficultyOverride;
        }
        super(gridBounds, new Vector2(1, 0), difficulty, "","");

        this.adCoverage = adCoverage;
        this.isBossPart = true;

        this.rootDifficulty = [0.8, 0.8, 0.75];
        this.childDifficulty = [0.6, 0.74, 0.5];
        this.fillerChildDifficulty = [0.5, 0.6, 0.4];

        this.totalAdsSpawned = 0;
        this.adsDestroyed = 0;
        this.initialBorderWidth = 12;
        this.maxSpawnAds = Number.Infinity;

        this.adStrikeFormattingTier = 3;
        this.encryptionFormattingTier = 2;

        this.structures = [
            new BossAdStructure(
                new AdDataMinimum([2, 1, 3, 4], new Vector2(0, -1),  this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([0, 0, 2, 2], new Vector2(-1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([2, 0, 3, 1], new Vector2(0, -1), this.fillerChildDifficulty, null, false, 0),
                    new AdDataMinimum([0, 2, 2, 3], new Vector2(0, 1), this.fillerChildDifficulty, null, false, 4),
                    new AdDataMinimum([0, 3, 2, 4], new Vector2(-1, 0), this.fillerChildDifficulty, null, false, 12),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([3, 2, 6, 3], new Vector2(0, -1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([3, 0, 6, 2], new Vector2(0, -1), this.childDifficulty, null, true),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([6, 1, 7, 4], new Vector2(0, -1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([7, 0, 9, 2], new Vector2(1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([6, 0, 7, 1], new Vector2(0, -1), this.fillerChildDifficulty, null, false, 0),
                    new AdDataMinimum([7, 2, 9, 3], new Vector2(0, 1), this.fillerChildDifficulty, null, false, 4),
                    new AdDataMinimum([7, 3, 9, 4], new Vector2(1, 0), this.fillerChildDifficulty, null, false, 8),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([6, 4, 7, 8], new Vector2(0, 1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([7, 4, 9, 6], new Vector2(1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([3, 6, 6, 8], new Vector2(-1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([7, 6, 9, 7], new Vector2(1, 0), this.fillerChildDifficulty, null, false, 0),
                    new AdDataMinimum([7, 7, 9, 8], new Vector2(0, 1), this.fillerChildDifficulty, null, false, 4),
                    new AdDataMinimum([7, 8, 9, 9], new Vector2(1, 0), this.fillerChildDifficulty, null, false, 12),
                    new AdDataMinimum([5, 8, 7, 9], new Vector2(-1, 0), this.fillerChildDifficulty, null, false, 8),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([2, 4, 3, 8], new Vector2(0, 1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([0, 4, 2, 6], new Vector2(-1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([0, 6, 2, 7], new Vector2(-1, 0), this.fillerChildDifficulty, null, false, 0),
                    new AdDataMinimum([0, 7, 2, 8], new Vector2(0, 1), this.fillerChildDifficulty, null, false, 4),
                    new AdDataMinimum([0, 8, 2, 9], new Vector2(-1, 0), this.fillerChildDifficulty, null, false, 12),
                    new AdDataMinimum([2, 8, 5, 9], new Vector2(1, 0), this.fillerChildDifficulty, null, false, 8),
                ]
            )
        ];

        this.hintedAdsAmount = 0;
        this.topLevelAds = [];
        this.allAds = [];
        this.allRoots = [];
        this.allChildren = [];
        this.purgeCallbacks.push(this.purgedSelf);

        this.encryptionExchangeRate = 25000;
        this.adStrikeExchangeRate = 130;

        this.nextRootHandle = new TimerHandle(-1);
        this.nextChildHandle = new TimerHandle(-1);

        this.purgeVibrateHandle = new TimerHandle(-1);
        this.encryptVibrateHandle = new TimerHandle(-1);
        this.spawnChildAnimHandle = new TimerHandle(-1);

        this.spawnBlacklistDelay = 45;
        this.adSpawnGrowDelay = 0.5;
        this.suckGrowTreshold = 0.5;

        this.rootSpawnCooldown = [10,15];
        this.childSpawnCooldown = [10,15];

        this.isDefeated = false;
        this.pendingSaveDataUpdate = false;

        this.getAdCoverDataStructure    = this.getAdCoverDataStructure.bind(this);
        this.purgeChildAd               = this.purgeChildAd.bind(this);
        this.encryptChildAd             = this.encryptChildAd.bind(this);
        this.purgedSelf                 = this.purgedSelf.bind(this);

        this.scheduleNextRoot   = this.scheduleNextRoot.bind(this);
        this.scheduleNextChild  = this.scheduleNextChild.bind(this);
    }

    activate() {
        GameManager.globalEventListener.addGlobalListener("resize", this.windowResized);
        GameManager.resourceManager.add_resourceChangedCallback(this.resourceChanged.bind(this));
        this.interactionElement.addEventListener("animationend", this.animationFinished);
        this.interactionElement.addEventListener("animationcancel", this.animationFinished);

        this.layoutElement.classList.add("bossAd");
        this.interactionElement.classList.add("bossAdBorderAnimation");

        TimerManager.setTimer(0.25, function () {
            this.interactionElement.classList.remove("bossAdBorderAnimation");
        }.bind(this));

        this.setFreezeTimes(0, 0);

        if (this.pendingSaveDataUpdate === false) {
            this.spawnInitialAds(true, 2);
            this.scheduleNextChild();
            this.scheduleNextRoot();
        }
    }

    spawnInitialAds(shakeGrid, spawnSpeed) {
        let maxAds = 0;

        for (let structure of this.structures) {
            maxAds++;

            if (structure.root.adCover == null) {
                this.addNewAd(structure.root, structure).growSpeed = spawnSpeed;
            }

            TimerManager.setTimer(1 / spawnSpeed, function () {

                if (shakeGrid === true) this.shakeMainGrid(true);
                for (let child of structure.children) {
                    maxAds++;

                    if (child.spawnsInitially === true && child.adCover == null) {
                        this.addNewAd(child, structure).growSpeed = spawnSpeed;
                    }
                }

                TimerManager.setTimer(1 / spawnSpeed, function () {
                    if (shakeGrid === true) this.shakeMainGrid(true);
                    this.maxSpawnAds = maxAds;
                }.bind(this));
            }.bind(this));
        }
    }

    tick(deltaTime) {
        super.tick(deltaTime);

        for (let adData of this.allAds) {
            adData.adCover.tick(deltaTime);
            //this.suckToolResources(adData, deltaTime);
        }
    }

    offsetGrow(growOffset) {
        for (let adData of this.topLevelAds) {
            adData.adCover.offsetGrow(growOffset);
        }
    }

    addNewAd(adData, owningStructure, loadedData) {
        if (adData.adCover != null) return;

        let adCover = new AdCover(adData.gridBounds, adData.growDirection, this.getDifficulty(adData, loadedData));
        adData.adCover = adCover;
        adCover.setIsBossPart(true);
        this.adCoverage.initAdCover(adCover, true);

        adCover.purgeCallbacks.push(this.purgeChildAd);
        adCover.encryptCallback = this.encryptChildAd;
        adCover.purgeNotifies.push(this.animatePurgedChild.bind(this));
        this.scheduleGrowSpeedReset(adData);
        adCover.setGrow(0);
        adCover.clickDiscardFraction = 0;

        adCover.setFreezeTimes(4.0, 10.0);
        this.topLevelAds.push(adData);
        this.allAds.push(adData);

        // Handle removing root from top ads
        if (!adData.isStructure && owningStructure.root.adCover != null) {
            FunLib.removeFromArray(this.topLevelAds, owningStructure.root);
        }

        if (adData.isStructure) {
            // Handle visual effect of chaining
            for (let child of owningStructure.children) {
                this.blacklistAd(child, this.adSpawnGrowDelay);
            }

            this.allRoots.push(adData);
        }
        else {
            this.allChildren.push(adData);
        }

        let className = "adSlither_" + Math.round(Math.random() * 7);
        adCover.layoutElement.classList.add(className);
        adData.coverId = adCover.id;

        this.spawnedNewAd(adData);
        this.totalAdsSpawned++;
        return adCover;
    }
    getDifficulty(adData, loadedData) {
        return adData.adDifficulty;
    }
    removeAd(adData, owningStructure) {
        if (adData.adCover == null) return;

        this.adCoverage.removeAd(adData.adCover);
        FunLib.removeFromArray(this.topLevelAds, adData);
        FunLib.removeFromArray(this.allAds, adData);
        adData.adCover = null;
        adData.isHinted = false;

        this.blacklistAd(adData, this.spawnBlacklistDelay);

        // Handle adding root to top ads
        if (!adData.isStructure && owningStructure.root.adCover != null) {
            let foundChildren = false;
            for (let child of owningStructure.children) {
                if (child.adCover != null) {
                    foundChildren = true;
                    break;
                }
            }
            if (!foundChildren) {
                this.topLevelAds.push(owningStructure.root);
            }
        }
        else if (adData.isStructure && owningStructure.root.adCover == null) {
            for (let child of owningStructure.children) {
                if (child.adCover != null) {
                    child.adCover.requestPurge(null, true);
                }
                if (child.isHinted) {
                    this.hintedAdsAmount--;
                    TimerManager.removeTimer(child.spawnHintHandle);
                    child.isHinted = false;

                    if (child.spawnHint != null) child.spawnHint.remove();
                }
            }
        }

        if (adData.isStructure) {
            FunLib.removeFromArray(this.allRoots, adData);
            TimerManager.setTimerLifespan(this.nextRootHandle, TimerManager.getTimerLifespan(this.nextRootHandle) * this.getRootDelayMultiplier());
        }
        else {
            FunLib.removeFromArray(this.allChildren, adData);
            TimerManager.setTimerLifespan(this.nextChildHandle, TimerManager.getTimerLifespan(this.nextChildHandle) * this.getChildDelayMultiplier());
        }


        this.adsDestroyed++;
        this.removedAd(adData);
        adData.coverId = -1;
    }

    getAdCoverDataStructure(adCover) {
        for (let structure of this.structures) {
            if (structure.root.adCover == adCover) {
                return { adData: structure.root, structure: structure };
            }

            for (let child of structure.children) {
                if (child.adCover == adCover) {
                    return { adData: child, structure: structure };
                }
            }
        }
    }

    purgeChildAd(adCover) {
        let dataStructure = this.getAdCoverDataStructure(adCover);
        if (dataStructure != null) {
            this.removeAd(dataStructure.adData, dataStructure.structure);
            dataStructure.adData.isPurged = true;
        }

        let adStrikeDelta = adCover.purgeCost * this.adStrikeExchangeRate;
        this.applyCachedPurgeCostOffsetChange(-adStrikeDelta);

        // Vibrate
        if (TimerManager.isTimerActive(this.purgeVibrateHandle) === true) {
            this.interactionElement.classList.remove("bossPurgeVibrate");
            void this.interactionElement.offsetHeight;

            TimerManager.removeTimer(this.purgeVibrateHandle);
        }

        if (this.markedForPurge === false) {
            this.interactionElement.classList.add("bossPurgeVibrate");
            this.purgeVibrateHandle = TimerManager.setTimer(1.5, function () { this.interactionElement.classList.remove("bossPurgeVibrate"); }.bind(this));
        }
    }
    encryptChildAd(adCover, encryptionDelta) {
        encryptionDelta = encryptionDelta * this.encryptionExchangeRate;

        if (encryptionDelta != 0) {
            this.applyCachedPurgeCostOffsetChange(-encryptionDelta);
        }

        if (this.markedForPurge === false) {
            // Vibrate
            if (encryptionDelta !== 0 && TimerManager.isTimerActive(this.encryptVibrateHandle) === false) {
                this.interactionElement.classList.add("bossEncryptVibrate");

                this.encryptVibrateHandle = TimerManager.setTimer(0.5, function () { this.interactionElement.classList.remove("bossEncryptVibrate"); }.bind(this));
            }
        }
        this.encryptedAd(adCover);
    }
    encryptedAd(adCover) {

    }

    requestPurge(e, bypassResourceCheck, instant) {
        this.interactionElement.classList.remove("bossPurgeVibrate");
        TimerManager.removeTimer(this.purgeVibrateHandle);
        this.interactionElement.classList.remove("bossEncryptVibrate");
        TimerManager.removeTimer(this.encryptVibrateHandle);
        this.layoutElement.classList.add("bossSpawnChild");
        TimerManager.removeTimer(this.spawnChildAnimHandle);

        super.requestPurge(e, bypassResourceCheck, instant);
    }

    purgedSelf(adCover) {
        GameManager.globalEventListener.removeGlobalListener("resize", adCover.windowResized);
        adCover.isDefeated = true;

        TimerManager.removeTimer(adCover.nextRootHandle);
        TimerManager.removeTimer(adCover.nextChildHandle);

        for (let ad of adCover.allAds) {
            ad.adCover.isDefeated = true;
        }
        for (let structure of adCover.structures) {
            if (structure.root.adCover == null) continue;
            structure.root.adCover.requestPurge(null, true);
        }

        adCover.layoutElement.parentNode.classList.remove("mainGridShake", "mainGridShakeSevere", "mainGridShakeAbsolute");
        adCover.layoutElement.parentNode.offsetHeight;
        adCover.layoutElement.parentNode.classList.add("mainGridShakeAbsolute");

        GameManager.bossDefeated = true;
        // GameSave
        GameManager.saveRankData();
        GameManager.gameSave.readProperty("bossData").adData.isBlocked = true;
        GameManager.gameSave.writeProperty("bossDefeatedTimes", GameManager.gameSave.readProperty("bossDefeatedTimes") + 1, false);

        GameManager.saveGame_scheduled();

        GameManager.bossStarted = false;

        GameManager.analyticsManager.completeLevel("bossBoard");

        TimerManager.setTimer(4, function () {
            document.querySelector("#mainGridContainer").classList.remove("mainGridShake", "mainGridShakeSevere", "mainGridShakeAbsolute");
            GameManager.gameWon();
        }.bind(this));
    }


    scheduleNextRoot() {
        let availableAds = [];
        for (let structure of this.structures) {
            if (structure.root.adCover != null || structure.root.blacklistTimerHandle != null || this.getPurgedCancellation(structure.root) === true || structure.root.isHinted === true) continue;
            availableAds.push({ adData: structure.root, owningStructure: structure });
        }

        if (availableAds.length > 0) {
            let choice = availableAds[Math.round(Math.random() * (availableAds.length - 1))];
            this.hintAndSpawn(choice.adData, choice.owningStructure);
        }

        // Set next spawn
        let timerMultiplier = this.getRootDelayMultiplier();
        let nextDelay = FunLib.lerpNumber(Math.random(), this.rootSpawnCooldown[0], this.rootSpawnCooldown[1]) * timerMultiplier;
        TimerManager.removeTimer(this.nextRootHandle);
        this.nextRootHandle = TimerManager.setTimer(nextDelay, this.scheduleNextRoot);
    }
    scheduleNextChild() {
        let availableAds = [];
        for (let structure of this.structures) {
            if (structure.root.adCover == null || structure.root.adCover.adFrozen) continue;

            for (let child of structure.children) {
                if (child.adCover != null || child.blacklistTimerHandle != null || this.getPurgedCancellation(child) === true || child.isHinted === true) continue;
                if (child.destroyedTreshold > this.adsDestroyed) continue;
                availableAds.push({ adData: child, owningStructure: structure });
            }
        }

        if (availableAds.length > 0) {
            let choice = availableAds[Math.round(Math.random() * (availableAds.length - 1))];
            this.hintAndSpawn(choice.adData, choice.owningStructure);
        }

        // Set next spawn
        let timerMultiplier = this.getChildDelayMultiplier();
        let nextDelay = FunLib.lerpNumber(Math.random(), this.childSpawnCooldown[0], this.childSpawnCooldown[1]) * timerMultiplier;
        TimerManager.removeTimer(this.nextChildHandle);
        this.nextChildHandle = TimerManager.setTimer(nextDelay, this.scheduleNextChild);
    }

    getPurgedCancellation(adData) {
        return adData.isPurged;
    }

    getRootDelayMultiplier() {
        return 1;
        //return FunLib.clamp(this.allRoots.length / 5, 0.05, 1);
    }
    getChildDelayMultiplier() {
        return 1;
        //return FunLib.clamp(this.allChildren.length / 16, 0.05, 1);
    }

    hintAndSpawn(adData, owningStructure) {
        let hintDuration = 4;

        adData.spawnHint = document.createElement("div");
        adData.spawnHint.classList.add("bossChildSpawnHint", this.getSpawnHintColor());
        adData.spawnHint.style["grid-area"] = (adData.gridBounds[1] + 1) + " / " + (adData.gridBounds[0] + 1) + " / " + (adData.gridBounds[3] + 1) + " / " + (adData.gridBounds[2] + 1);
        adData.spawnHint.style["animationDuration"] = hintDuration + "s";

        document.getElementById("mainGridContainer").appendChild(adData.spawnHint);
        adData.isHinted = true;
        this.hintedAdsAmount++;

        TimerManager.removeTimer(this.spawnChildAnimHandle);
        this.layoutElement.classList.add("bossSpawnChild");
        this.spawnChildAnimHandle = TimerManager.setTimer(5, function () { this.interactionElement.classList.remove("bossSpawnChild"); }.bind(this));

        adData.spawnHintHandle = TimerManager.setTimer(hintDuration, function () {
            this.hintedAdsAmount--;
            this.layoutElement.classList.remove("bossSpawnChild");
            adData.spawnHint.remove();
            this.addNewAd(adData, owningStructure);
        }.bind(this));

        this.hintedAd(adData);
    }
    getSpawnHintColor() {
        return "blue";
    }

    spawnedNewAd(adData) {

    }
    removedAd(adData) {

    }
    hintedAd(adData) {

    }

    scheduleGrowSpeedReset(adData) {
        if (adData.spawnGrowTimerHandle != null) {
            TimerManager.removeTimer(adData.spawnGrowTimerHandle);
        }

        if (adData.adCover != null) {
            adData.adCover.growSpeed = 2;
            adData.adCover.freezeProtection = true;
        }

        TimerManager.setTimer(this.adSpawnGrowDelay, function() {
            if (adData.adCover != null) {
                adData.adCover.growSpeed = 1;
                adData.adCover.freezeProtection = false;

                this.adFinishedSpawning(adData);
            }
        }.bind(this));

    }
    adFinishedSpawning(adData) {

    }

    suckToolResources(adData, deltaTime) {
        //return;

        let markedForFailure = false;
        if (adData.isStructure) { markedForFailure = true; }
        if (adData.adCover == null || adData.adCover.adFrozen) { markedForFailure = true; }
        if (adData.adCover.growProgress < this.suckGrowTreshold) { markedForFailure = true; }

        if (markedForFailure) {
            adData.adCover.isSucking = false;
            adData.adCover.layoutElement.classList.remove("adResourceSuckAnimation");
            return;
        }

        if (!adData.adCover.isSucking) {
            adData.adCover.layoutElement.classList.add("adResourceSuckAnimation");
        }
        adData.adCover.isSucking = true;

        let tools = GameManager.gridInitializer.gridManager.getToolsInBounds([new Vector2(adData.gridBounds[0], adData.gridBounds[1]), new Vector2(adData.gridBounds[2], adData.gridBounds[3])]);
        for (let tool of tools) {
            let randIndex = Math.round(Math.random() * (tool.resourceRoles.length - 1));
            let resourceRole = tool.resourceRoles[randIndex];
            let delta = this.getConvertedTool(resourceRole, -4000 * deltaTime / tool.resourceRoles.length);
            GameManager.resourceManager.applyResourceChange(delta, adData.adCover.interactionElement, true, true, AnalyticsResource.quick("adSucking", "adId_" + this.id));
        }
    }
    getConvertedTool(resourceId, initialValue) {
        switch (resourceId) {
            case "money":
                return new IdValue(resourceId, initialValue / 1);
            case "adStrike":
                return new IdValue(resourceId, initialValue / 2); //1.5);
            case "encryption":
                return new IdValue(resourceId, initialValue / 1000);
        }
    }

    blacklistAd(adData, duration) {
        if (adData.blacklistTimerHandle != null) {
            if (TimerManager.getTimerTimeLeft(adData.blacklistTimerHandle) >= duration) {
                return;
            }
            else {
                TimerManager.setTimerLifespan(adData.blacklistTimerHandle, duration, true);
                return;
            }
        }

        adData.blacklistTimerHandle = TimerManager.setTimer(duration, function () { adData.blacklistTimerHandle = null; });
    }

    updateToLoadedData() {
        let saveData = GameManager.gameSave.readProperty("bossData").adData;

        //this.applyCachedPurgeCostOffsetChange(saveData.cachedPurgeCostOffset);
        //this.addEncryption(saveData.encryption);
        this.setGrow(1);
        this.setAdImage(saveData.imgSrc);
        // write main logic duh
    }

    animatePurgedChild(adCover) {
        if (this.markedForPurge === true) return;
        if (adCover == null || adCover == undefined) return;

        let centerSelf = new Vector2((this.gridBounds[0].x + this.gridBounds[1].x) / 2, (this.gridBounds[0].y + this.gridBounds[1].y) / 2);
        let centerChild = new Vector2((adCover.gridBounds[0].x + adCover.gridBounds[1].x) / 2, (adCover.gridBounds[0].y + adCover.gridBounds[1].y) / 2);
        let direction = centerSelf.sub(centerChild).div(new Vector2(4, 4)).mult_num(40);
        let translateString = "translate(" + Math.round(direction.x) + "vh, " + Math.round(direction.y) + "vh)";

        adCover.layoutElement.style["transform"] = translateString;
        adCover.layoutElement.classList.add("adPurgeShift");
    }
}

class EndlessBossAdCover extends BossAdCover {
    constructor(gridBounds, adCoverage) {
        super(gridBounds, adCoverage, -1);

        this.rootDifficulty = [0.2, 0.8, 0.2];
        this.childDifficulty = [0, 0.74, 0];
        this.fillerChildDifficulty = [0, 0.6, 0];

        this.rootDifficultyGrow = [0.04, 0, 0.035];
        this.childrenDifficultyGrow = [0.01, 0, 0.01];

        this.endlessScore = 0;
        this.spawnedAdsTreshold = 5;
        this.endlessWarningContainer = null;

        this.structures = [
            new BossAdStructure(
                new AdDataMinimum([2, 1, 3, 4], new Vector2(0, -1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([0, 0, 2, 2], new Vector2(-1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([2, 0, 3, 1], new Vector2(0, -1), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([0, 2, 2, 3], new Vector2(0, 1), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([0, 3, 2, 4], new Vector2(-1, 0), this.fillerChildDifficulty, null, false),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([3, 2, 6, 3], new Vector2(0, -1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([3, 0, 6, 2], new Vector2(0, -1), this.childDifficulty, null, true),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([6, 1, 7, 4], new Vector2(0, -1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([7, 0, 9, 2], new Vector2(1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([6, 0, 7, 1], new Vector2(0, -1), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([7, 2, 9, 3], new Vector2(0, 1), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([7, 3, 9, 4], new Vector2(1, 0), this.fillerChildDifficulty, null, false),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([6, 4, 7, 8], new Vector2(0, 1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([7, 4, 9, 6], new Vector2(1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([3, 6, 6, 8], new Vector2(-1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([7, 6, 9, 7], new Vector2(1, 0), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([7, 7, 9, 8], new Vector2(0, 1), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([7, 8, 9, 9], new Vector2(1, 0), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([5, 8, 7, 9], new Vector2(-1, 0), this.fillerChildDifficulty, null, false),
                ]
            ),
            new BossAdStructure(
                new AdDataMinimum([2, 4, 3, 8], new Vector2(0, 1), this.rootDifficulty, null, true),
                [
                    new AdDataMinimum([0, 4, 2, 6], new Vector2(-1, 0), this.childDifficulty, null, true),
                    new AdDataMinimum([0, 6, 2, 7], new Vector2(-1, 0), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([0, 7, 2, 8], new Vector2(0, 1), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([0, 8, 2, 9], new Vector2(-1, 0), this.fillerChildDifficulty, null, false),
                    new AdDataMinimum([2, 8, 5, 9], new Vector2(1, 0), this.fillerChildDifficulty, null, false),
                ]
            )
        ];

        this.rootSpawnCooldown = [10, 15];
        this.childSpawnCooldown = [10, 15];
        // this.rootSpawnCooldown = [0, 0];
        // this.childSpawnCooldown = [0, 0];

        // this.spawnBlacklistDelay = 1;
    }

    constructElement() {
        let element = super.constructElement();

        this.adPurgeButton.removeEventListener("click", this.requestPurge);
        this.adPurgeX.innerHTML = "SCORE";
        this.adEncryptButton.classList.add("hidden");
        let endlessButton = this.adInteraction.querySelector(".adEndlessButton");
        if (endlessButton != null && endlessButton != undefined) {
            endlessButton.remove();
        }

        this.endlessWarningContainer = document.getElementById("endlessWarningContainer");
        if (this.endlessWarningContainer == undefined || this.endlessWarningContainer == null) {
            this.endlessWarningContainer = document.createElement("div");
            this.endlessWarningContainer.id = "endlessWarningContainer";

            document.getElementById("mainGridContainer").appendChild(this.endlessWarningContainer);
            this.endlessWarningContainer.style["grid-area"] =  "1 / 1 / 10 / 10";
        }

        return element;
    }

    getDifficulty(adData, loadedData) {
        if (loadedData == undefined || loadedData == null) {
            let selectedGrow = this.childrenDifficultyGrow;
            if (adData.isStructure === true) {
                this.selectedGrow = this.rootDifficultyGrow;
            }

            let multiplier = this.totalAdsSpawned - this.spawnedAdsTreshold;
            multiplier = FunLib.clamp(multiplier, 0, multiplier);

            return [
                adData.adDifficulty[0] + selectedGrow[0] * multiplier,
                adData.adDifficulty[1] + selectedGrow[1] * multiplier,
                adData.adDifficulty[2] + selectedGrow[2] * multiplier
            ];
        }
        else {
            return loadedData.adDifficulty;
        }
    }

    getPurgedCancellation(adData) {
        return false;
    }

    createAdSaveData(adCover) {
        let saveData = new SaveData_Ad(adCover.id, false, adCover.gridBounds, adCover.encryptionScore, adCover.imgSrc, adCover.cachedPurgeCostOffset, adCover.adDifficulty, adCover.growDirection);
        saveData.isBossPart = true;
        return saveData;
    }
    spawnedNewAd(adData) {
        this.setGameOverWarning(this.getAdsLeftToSpawn() + this.hintedAdsAmount);

        GameManager.gameSave.readProperty("bossData").totalAdsSpawned = this.totalAdsSpawned;
        if (adData.isStructure) {
            GameManager.gameSave.readProperty("bossData").rootData[adData.coverId] = this.createAdSaveData(adData.adCover);
        }
        else {
            GameManager.gameSave.readProperty("bossData").childrenData[adData.coverId] = this.createAdSaveData(adData.adCover);
        }
    }
    encryptedAd(adCover) {
        let adData = this.getAdCoverDataStructure(adCover);
        let saveData = GameManager.gameSave.readProperty("bossData").childrenData[adData.coverId];
        if (adData.isStructure) {
            saveData = GameManager.gameSave.readProperty("bossData").rootData[adData.coverId];
        }

        if (saveData == undefined) return;

        saveData.encryption = adCover.encryptionScore;
        saveData.cachedPurgeCostOffset = adCover.cachedPurgeCostOffset;
    }
    removedAd(adData) {
        this.setGameOverWarning(this.getAdsLeftToSpawn());

        if (adData.isStructure) {
            delete GameManager.gameSave.readProperty("bossData").rootData[adData.coverId];
        }
        else {
            delete GameManager.gameSave.readProperty("bossData").childrenData[adData.coverId];
        }
    }
    adFinishedSpawning(adData) {
        let adsLeft = this.maxSpawnAds - this.allAds.length;
        if (adsLeft <= 0) {
            this.triggerGameOver();
        }
    }

    getAdsLeftToSpawn() {
        return this.maxSpawnAds - (this.allAds.length + this.hintedAdsAmount);
    }
    setGameOverWarning(severity) {
        //console.log(severity);
        switch (severity) {
            case 3:
                this.endlessWarningContainer.classList.remove("gameOverWarning_2", "gameOverWarning_1");
                this.endlessWarningContainer.classList.add("gameOverWarning_3");
                break;
            case 2:
                this.endlessWarningContainer.classList.remove("gameOverWarning_3", "gameOverWarning_1");
                this.endlessWarningContainer.classList.add("gameOverWarning_2");
                break;
            case 1:
                this.endlessWarningContainer.classList.remove("gameOverWarning_3", "gameOverWarning_2");
                this.endlessWarningContainer.classList.add("gameOverWarning_1");
                break;
            case 0:
                this.endlessWarningContainer.classList.remove("gameOverWarning_3", "gameOverWarning_2");
                this.endlessWarningContainer.classList.add("gameOverWarning_1");
                break;
            default:
                this.endlessWarningContainer.classList.remove("gameOverWarning_3", "gameOverWarning_2", "gameOverWarning_1");
                break;
        }
    }
    getSpawnHintColor() {
        switch (this.getAdsLeftToSpawn()) {
            case 3:
                return "yellow";
            case 2:
                return "orange";
            case 1:
                return "red";
            case 0:
                return "red";
            default:
                return "blue";
        }
    }

    applyCachedPurgeCostOffsetChange(delta) {
        this.endlessScore = Math.round(this.endlessScore - delta);
        GameManager.gameSave.readProperty("bossData").endlessScore = this.endlessScore;

        super.applyCachedPurgeCostOffsetChange(delta);
    }
    getString_purgeCost() {
        return ResourceManager.formatResource(this.endlessScore, 3);
    }

    triggerGameOver() {
        if (GameManager.gameOverTriggered === true) return;

        GameManager.saveEndlessRankData(this.endlessScore);
        GameManager.endlessGameOver();
    }

    updateToLoadedData() {
        let saveData = GameManager.gameSave.readProperty("bossData");
        let cahced_totalAdsSpawned = saveData.totalAdsSpawned;

        this.setGrow(1);
        this.setAdImage(saveData.imgSrc);

        this.loadAdsFromData(saveData.rootData, saveData.childrenData);

        this.totalAdsSpawned = cahced_totalAdsSpawned;
        GameManager.gameSave.readProperty("bossData").totalAdsSpawned = this.totalAdsSpawned;
        this.endlessScore = saveData.endlessScore;
        this.applyCachedPurgeCostOffsetChange(0);

        this.scheduleNextChild();
        this.scheduleNextRoot();
    }
    loadAdsFromData(rootData, childrenData) {
        let rootLoadData = {};
        let childrenLoadData = {};
        for (let rootSaveId in rootData) {
            rootLoadData[rootSaveId] = rootData[rootSaveId];
            delete rootData[rootSaveId];
        }
        for (let childSaveId in childrenData) {
            childrenLoadData[childSaveId] = childrenData[childSaveId];
            delete childrenData[childSaveId];
        }

        let maxAds = 0;

        for (let structure of this.structures) {
            maxAds++;

            for (let rootSaveId in rootLoadData) {
                let rootSave = rootLoadData[rootSaveId];

                if (structure.root.boundsEqual(rootSave.gridBounds) === true) {
                    let adCover = this.addNewAd(structure.root, structure, rootSave);
                    adCover.setGrow(1);
                    adCover.setAdImage(rootSave.imgSrc);
                    break;
                }
            }

            for (let child of structure.children) {
                maxAds++;

                for (let childSaveId in childrenLoadData) {
                    let childSave = childrenLoadData[childSaveId];
                    if (child.boundsEqual(childSave.gridBounds) === true) {
                        let adCover = this.addNewAd(child, structure, childSave);
                        adCover.setGrow(1);
                        adCover.setAdImage(childSave.imgSrc);
                        break;
                    }
                }
            }

            this.maxSpawnAds = maxAds;
        }

        this.setGameOverWarning(this.getAdsLeftToSpawn());
    }


    scheduleNextRoot() {
        if (GameManager.gameOverTriggered === true) return;
        super.scheduleNextRoot();
    }
    scheduleNextChild() {
        if (GameManager.gameOverTriggered === true) return;
        super.scheduleNextChild();
    }
    hintAndSpawn(adData, owningStructure) {
        if (GameManager.gameOverTriggered === true) return;
        super.hintAndSpawn(adData, owningStructure);
    }
}



class SelloutAdCover extends AdCover {

    constructor(gridBounds, growDirection, revenue, maxEncryptionScore, headerText, bodyText) {
        super(gridBounds, growDirection, 0.0, headerText, bodyText);

        this.revenue = revenue; // num

        this.setGrowSpeed                   = this.setGrowSpeed.bind(this);
        this.setClickRequirement            = this.setClickRequirement.bind(this);
        this.setRevenue                     = this.setRevenue.bind(this);
    }

    constructElement() {
        let element = super.constructElement();
        element.querySelector(".adPurgeCost").textContent = "remove";

        return element;
    }

    tick(deltaTime) {
        super.tick(deltaTime);
        GameManager.resourceManager.applyResourceChange(new IdValue("money", this.revenue * deltaTime), this.interactionElement, true, false, AnalyticsResource.quick("selloutRevenue", "adId_" + this.id));
    }

    setGrowSpeed(growSpeed) {
        this.growSpeed = growSpeed;
    }

    setClickRequirement(clickRequirement) {
        this.clickRequirement = clickRequirement;
    }

    setRevenue(revenue) {
        this.revenue = revenue;
    }
}