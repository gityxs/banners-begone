//
// ToolComponent
//
class ToolComponent {

    constructor(execOrderOverrides) {
        this.ownerTool = null;
        this.execOrderOverrides = execOrderOverrides; // ExecOrderOverride[]
        //if (this.execOrderOverrides == null || this.execOrderOverrides == undefined) {
        //    this.execOrderOverrides = [];
        //}

        this.hasOverrides = false; // bool
        if (this.execOrderOverrides.length > 0) {
            this.hasOverrides = true;
        }

        this.enabled = true;

        this.create             = this.create.bind(this);
        this.activate           = this.activate.bind(this);
        this.deactivate         = this.deactivate.bind(this);
        this.tick               = this.tick.bind(this);
        this.inputSucceeded     = this.inputSucceeded.bind(this);
        this.getUpgradeMembers  = this.getUpgradeMembers.bind(this);
        this.getMember          = this.getMember.bind(this);
        this.membersUpdated     = this.membersUpdated.bind(this);
        this.setSelectorText    = this.setSelectorText.bind(this);
        this.updatePersonalData = this.updatePersonalData.bind(this);
    }

    // Lifecycle functions
    create(argObj) {
        this.ownerTool = argObj.ownerTool;
    }

    activate(argObj) {
    }

    deactivate() {
    }

    tick(argObj) {
    }

    inputSucceeded(argObj) {
    }

    getUpgradeMembers() {
        return [];
    }

    getMember(memberName) {
        return UpgradeManager.getMemberValue(this.ownerTool.id, memberName);
    }

    membersUpdated() {
    }

    setSelectorText(selector, text) {
        let element = this.customInputElement.querySelector(selector);
        if (element != undefined) {
            element.textContent = text;
        }
    }

    updatePersonalData(personalData) {
    }
}

//
// ApmComponent
//
class ApmComponent extends ToolComponent {
    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.apmHistory = [];
        this.maxApmEntries = 5;
        this.apmEntryLifetime = 0.5;
        this.timeSinceLastApmEntry = 0.0;
        this.currentApm = 0.0;
        this.maxApm = 0.0;
        this.apmTimerHandle = new TimerHandle(-1);

        this.removeApmEntry         = this.removeApmEntry.bind(this);
        this.clearApmEntries        = this.clearApmEntries.bind(this);
        this.addApmEntry            = this.addApmEntry.bind(this);
        this.updateApm              = this.updateApm.bind(this);
        this.updateUiCurrentApm     = this.updateUiCurrentApm.bind(this);
        this.updateUiMaxApm         = this.updateUiMaxApm.bind(this);
    }

    getUpgradeMembers() {
        return [
            new IdValue("actionDurationMultiplier", 0.75),
        ];
    }

    // Lifecycle functions
    activate(argObj) {
        this.updateApm();
        this.updateUiCurrentApm(this.currentApm);
        this.updateUiMaxApm(this.maxApm);

        this.apmTimerHandle = TimerManager.setTimer(this.apmEntryLifetime, this.removeApmEntry, null, true);
    }

    deactivate() {
        TimerManager.removeTimer(this.apmTimerHandle);
    }

    tick(argObj) {
        this.timeSinceLastApmEntry += argObj.deltaTime;
        this.updateApm();
    }

    inputSucceeded(argObj) {
        this.addApmEntry(this.timeSinceLastApmEntry);
        this.timeSinceLastApmEntry = 0;
    }

    // Apm API
    removeApmEntry() {
        if (this.apmHistory.length <= 0) return;

        if (this.timeSinceLastApmEntry >= this.apmEntryLifetime) {
            this.apmHistory.shift();
        }

        this.updateApm();
    }

    clearApmEntries() {
        this.apmHistory.length = 0;
        this.updateApm();
    }

    addApmEntry(actionDuration) {
        while (this.apmHistory.length >= this.maxApmEntries) {
            this.apmHistory.shift();
        }
        this.apmHistory.push(actionDuration * this.getMember("actionDurationMultiplier"));

        this.updateApm();
    }

    updateApm() {
        if (this.apmHistory.length <= 0) {
            if (this.currentApm != 0.0) {
                this.currentApm = 0.0;
                this.updateUiCurrentApm(this.currentApm);
            }
            return;
        }

        let durationSum = 0.0;
        for (let index = 0; index < this.apmHistory.length; index++) {
            durationSum += this.apmHistory[index];
        }

        let lastApm = this.currentApm;
        let lowEntryCountCorrection = this.apmHistory.length / this.maxApmEntries;
        this.currentApm = 1.0 / (durationSum / this.apmHistory.length / lowEntryCountCorrection) * 60;
        this.currentApm = Math.round(this.currentApm);

        if (lastApm != this.currentApm) {
            this.updateUiCurrentApm(this.currentApm);
        }

        if (this.currentApm > this.maxApm) {
            this.maxApm = this.currentApm;
            this.updateUiMaxApm(this.maxApm);
        }
    }

    updateUiCurrentApm(currentApm) {
        //let element = document.getElementById("apmComponent_inputApmCurrent");
        //element.textContent = currentApm + " :Current";
    }

    updateUiMaxApm(maxApm) {
        //let element = document.getElementById("apmComponent_inputApmMax");
        //element.textContent = "MAX: " + maxApm;
    }
}

//
// ChargeMinigameComponent
//
class ChargeMinigameComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        //execOrderOverrides.push(new ExecOrderOverride(LifecycleState.activate, LifecycleExecutionOrder.before, 0));
        super(execOrderOverrides);

        this.minigameInputHandler = new CrankInputHandler(0.4, null); // new RecognizerInputHandler(["circle", "inverse circle"], true, null, 0.7);

        this.chargeValue = 0;
        this.chargeRecord = 0;
        this.chargeText = null;
        this.recordText = null;
        this.minigameHint = null;
        this.hint_minigameTextContent = '<p>Spin the <b>Ad-Blocker</b> fan!</p>';
        this.hint_dischargeTextContent = '<p><b>Discharge</b><br>in progress...</p>';
        this.spinCounter = null;

        this.playerSpinRegenHandle = new TimerHandle(-1);

        this.cached_maxPlayerSpins = 0;
        this.playerSpinsLeft = 0;

        this.cachedRewards = null;
    }
    
    getUpgradeMembers() {
        return [
            new IdValue("playerSpinRegenCooldown", 4),
            new IdValue("spinReward", 5),
            new IdValue("maxPlayerSpins", 2),
        ];
    }

    membersUpdated() {
        if (TimerManager.isTimerActive(this.playerSpinRegenHandle) === true) {
            TimerManager.setTimerLifespan(this.playerSpinRegenHandle, this.getMember("playerSpinRegenCooldown"), false);
        }

        
        let lastMaxSpins = this.cached_maxPlayerSpins;
        this.cached_maxPlayerSpins = Math.round(this.getMember("maxPlayerSpins"));
        
        if (this.cached_maxPlayerSpins > lastMaxSpins) {
            TimerManager.removeTimer(this.playerSpinRegenHandle);

            this.playerSpinsLeft = this.cached_maxPlayerSpins;
            this.minigameInputHandler.setCanPlayerSpin(true);
            this.updatePlayerSpinsDisplay(true);
        }

        /*
        if (lastMaxSpins != this.cached_maxPlayerSpins) {
            this.playerSpinsLeft = FunLib.clamp(this.playerSpinsLeft + (this.cached_maxPlayerSpins - lastMaxSpins), 0, this.cached_maxPlayerSpins);

            if (this.playerSpinsLeft > 0) {
                this.minigameInputHandler.setCanPlayerSpin(true);
            }

            this.updatePlayerSpinsDisplay();
        }
        */
    }

    updatePersonalData(personalData) {
        this.chargeRecord = personalData["ChargeMinigameComponent_chargeRecord"];
        if (this.chargeRecord == null || this.chargeRecord == undefined) {
            this.chargeRecord = 0;
        }
        this.updateRecord(this.chargeRecord);
    }

    // Lifecycle functions
    activate(argObj) {
        let customInputElement = CustomInputElement.chargeMinigame();
        this.minigameInputHandler.customInputElement = customInputElement;
        this.ownerTool.swapInputHandler(this.minigameInputHandler);
        this.minigameInputHandler.playerSpinSucceededCallback = this.playerSpinSucceeded.bind(this);
        this.minigameInputHandler.accumulatedSpeedUpdatedCallback = this.speedUpdated.bind(this);
        this.minigameInputHandler.strengthUpdatedCallback = this.strengthUpdated.bind(this);

        this.ownerTool.inputDiv.classList.add("clickableGridElement");

        this.chargeText = customInputElement.querySelector(".chargeMinigameComponent_currentCharge");
        this.recordText = customInputElement.querySelector(".chargeMinigameComponent_currentRecord");
        this.minigameHint = customInputElement.querySelector(".inputElement_textHint");
        this.spinCounter = customInputElement.querySelector(".chargeMinigameComponent_spinCounter");

        this.cachedRewards = this.ownerTool.rewards;
        this.ownerTool.rewards = [];

        this.cached_maxPlayerSpins = this.getMember("maxPlayerSpins");
        this.playerSpinsLeft = this.cached_maxPlayerSpins;
        this.updatePlayerSpinsDisplay(true);
    }

    deactivate() {
        TimerManager.removeTimer(this.playerSpinRegenHandle);
        this.chargeValue = 0;
    }

    inputSucceeded(argObj) {
        this.ownerTool.giveRewards(1, [new IdValue("adStrike", this.getMember("spinReward"))], true);
    }

    updateRecord(newRecord) {
        this.chargeRecord = newRecord;
        this.recordText.innerHTML = ResourceManager.formatResource(this.chargeRecord, 3) + ' <mark class="colorInverse">RPM</mark>';

        // GameSave
        let personalData = this.ownerTool.personalData;
        personalData["ChargeMinigameComponent_chargeRecord"] = this.chargeRecord;
        this.ownerTool.applySaveDataPropertyChange("personalData", personalData);
    }

    tick(argObj) {
        if (this.playerSpinsLeft <= 0 && TimerManager.isTimerActive(this.playerSpinRegenHandle) === false) {
            this.playerSpinRegenHandle = TimerManager.setTimer(this.getMember("playerSpinRegenCooldown"), this.spinRestoreChain.bind(this));
        }
        // if (this.playerSpinsLeft < this.cached_maxPlayerSpins && TimerManager.isTimerActive(this.playerSpinRegenHandle) === false) {
        //     this.playerSpinRegenHandle = TimerManager.setTimer(this.getMember("playerSpinRegenCooldown"), this.restorePlayerSpin.bind(this));
        // }
    }

    playerSpinSucceeded() {
        if (this.playerSpinsLeft > 0) {
            this.playerSpinsLeft -= 1;
            this.updatePlayerSpinsDisplay();

            if (this.playerSpinsLeft <= 0) {
                this.minigameInputHandler.setCanPlayerSpin(false);
            }
        }
    }
    spinRestoreChain() {
        if (this.playerSpinsLeft >= this.cached_maxPlayerSpins) return;
        this.restorePlayerSpin();

        if (this.playerSpinsLeft < this.cached_maxPlayerSpins) {
            this.playerSpinRegenHandle = TimerManager.setTimer(this.getMember("playerSpinRegenCooldown"), this.spinRestoreChain.bind(this));
        }
        else {
            this.playerSpinRegenHandle = TimerManager.setTimer(0.3, function () {
                this.minigameInputHandler.setCanPlayerSpin(true);
                this.updatePlayerSpinsDisplay(true);
            }.bind(this));
        }
    }
    restorePlayerSpin() {
        if (this.playerSpinsLeft >= this.cached_maxPlayerSpins) return;

        this.playerSpinsLeft += 1;
        this.updatePlayerSpinsDisplay();
    }
    updatePlayerSpinsDisplay(highlight) {
        CustomInputElement.setChargePlayerSpins(this.spinCounter, this.playerSpinsLeft, this.cached_maxPlayerSpins);

        if (highlight === true) {
            CustomInputElement.highlightChargePlayerSpins(this.spinCounter);
        }
    }

    speedUpdated(newSpeed) {
        this.chargeValue = Math.round(newSpeed);
        this.chargeText.innerHTML = ResourceManager.formatResource(this.chargeValue, 3) + ' <mark class="colorInverse">RPM</mark>';

        if (this.chargeValue > this.chargeRecord) {
            this.recordText.parentNode.classList.add("succeeded");
            this.updateRecord(this.chargeValue);
        }
    }

    strengthUpdated(newStrength) {
        if (newStrength >= 0) {
            this.minigameHint.innerHTML = "<p>Spin power: " + Math.ceil(newStrength * 100) + "%</p>";
        }
        else {
            this.minigameHint.innerHTML = "<p>Spin the <b>Ad-Blocker</b> fan!</p>";
        }
    }
}

//
// ResourceGestureComponent
//
class ResourceGestureComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        //execOrderOverrides.push(new ExecOrderOverride(LifecycleState.activate, LifecycleExecutionOrder.before, 0));
        super(execOrderOverrides);
        
        this.resourceMap = new Map();
        this.resourceMap.set("v", new IdValue("VResource", 1));
        this.resourceMap.set("inverse v", new IdValue("VResource", 1));
        this.resourceMap.set("pigtail", new IdValue("PigtailResource", 1));
        this.resourceMap.set("inverse pigtail", new IdValue("PigtailResource", 1));
        this.resourceMap.set("star", new IdValue("StarResource", 1));
        this.resourceMap.set("inverse star", new IdValue("StarResource", 1));
        
        this.getGestureArray            = this.getGestureArray.bind(this);
        this.gestureRecognized          = this.gestureRecognized.bind(this);
        this.generateResourceHintArray  = this.generateResourceHintArray.bind(this);

        this.defaultInputHandler = null;
        this.minigameInputHandler = new RecognizerInputHandler(this.getGestureArray(this.resourceMap), false, this.gestureRecognized, 0.7);
    }

    // Lifecycle functions
    activate(argObj) {
        this.defaultInputHandler = this.ownerTool.inputHandler;

        let customInputElement = CustomInputElement.resourceGesture(this.generateResourceHintArray(this.resourceMap));
        this.minigameInputHandler.customInputElement = customInputElement;

        this.ownerTool.swapInputHandler(this.minigameInputHandler);
    }

    deactivate() {
        this.ownerTool.swapInputHandler(this.defaultInputHandler);
    }

    // Other functions
    getGestureArray(resourceMap) {
        let keyIterator = resourceMap.keys();
        let gestureArray = [];

        let result = keyIterator.next();
        while (result.done === false) {
            gestureArray.push(result.value);
            result = keyIterator.next();
        }

        return gestureArray;
    }

    generateResourceHintArray(resourceMap) {
        let keyIterator = resourceMap.keys();
        let hintArray = [];

        let result = keyIterator.next();
        while (result.done === false) {
            if (result.value.includes("inverse")) {
                result = keyIterator.next();
            }
            else {
                let hint = new IdValue(resourceMap.get(result.value).id, result.value);
                hintArray.push(hint);
                result = keyIterator.next();
            }
        }

        return hintArray;
    }

    gestureRecognized(result) {
        let resource = this.resourceMap.get(result.Name);
        if (resource === undefined || resource === null) return null;

        this.ownerTool.targetBlock.resourceRewards.push(resource);
    }
}

//
// FishingComponent
//
class FishingComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.defaultInputHandler = null;
        this.minigameInputHandler = new ClickInputHandler();

        this.fishingMinigameActive = false;

        this.fishingMinigameDuration = 1.0;
        this.fishingMinigameMinCooldown = 5.0;
        this.fishingMinigameMaxCooldown = 10.0;
        this.fishingMinigameTimerHandle = new TimerHandle(-1);
        this.fishingAmbientDelayTimerHandle = new TimerHandle(-1);

        this.specialRewards = [new IdValue("SpecialSnowflake", 0), new IdValue("PrototypingWeeks", 4), new IdValue("LostSanity", 1)];

        this.generateMinigameCooldown   = this.generateMinigameCooldown.bind(this);
        this.startFishingMinigame       = this.startFishingMinigame.bind(this);
        this.stopFishingMinigame        = this.stopFishingMinigame.bind(this);
        this.startMinigameCooldown      = this.startMinigameCooldown.bind(this);
        this.fishingSucceeded           = this.fishingSucceeded.bind(this);
        this.getFishedResource          = this.getFishedResource.bind(this);
        this.setAmbientFlashState       = this.setAmbientFlashState.bind(this);
        this.switchFromGreenToGrayAnim  = this.switchFromGreenToGrayAnim.bind(this);
    }

    // Lifecycle functions
    activate(argObj) {
        this.defaultInputHandler = this.ownerTool.inputHandler;
        this.startMinigameCooldown();
        this.setAmbientFlashState(true);
    }

    deactivate() {
        this.ownerTool.inputDiv.classList.remove("anim_flash_green");
        this.ownerTool.inputDiv.classList.remove("anim_flash_blue");   
        TimerManager.removeTimer(this.fishingMinigameTimerHandle);
        this.setAmbientFlashState(false);
        TimerManager.removeTimer(this.fishingAmbientDelayTimerHandle);
        TimerManager.removeTimer(this.minigameInputHandler);
    }

    // Other functions
    generateMinigameCooldown() {
        let cooldownDelta = this.fishingMinigameMaxCooldown - this.fishingMinigameMinCooldown;
        return Math.random() * cooldownDelta + this.fishingMinigameMinCooldown;
    }

    startFishingMinigame() {
        TimerManager.removeTimer(this.fishingAmbientDelayTimerHandle);
        this.setAmbientFlashState(false);

        TimerManager.removeTimer(this.fishingMinigameTimerHandle);
        this.fishingMinigameTimerHandle = TimerManager.setTimer(this.fishingMinigameDuration, this.stopFishingMinigame);

        this.ownerTool.swapInputHandler(this.minigameInputHandler);
        this.minigameInputHandler.inputDiv.classList.remove("anim_flash_green"); 
        this.minigameInputHandler.inputSuccededCallback = this.fishingSucceeded;
        this.minigameInputHandler.inputDiv.classList.add("anim_flash_blue");   
    }

    stopFishingMinigame() {
        this.minigameInputHandler.inputDiv.classList.remove("anim_flash_blue");   
        this.ownerTool.swapInputHandler(this.defaultInputHandler);

        TimerManager.removeTimer(this.fishingMinigameTimerHandle);
        this.startMinigameCooldown();

        this.fishingAmbientDelayTimerHandle = TimerManager.setTimer(0.25, this.switchFromGreenToGrayAnim);
    }

    startMinigameCooldown() {
        this.fishingMinigameTimerHandle = TimerManager.setTimer(this.generateMinigameCooldown(), this.startFishingMinigame);
    }

    fishingSucceeded(inputScore) {
        this.stopFishingMinigame();
        this.ownerTool.inputDiv.classList.add("anim_flash_green");

        this.ownerTool.targetBlock.resourceRewards.push(this.getFishedResource());
        this.ownerTool.inputSucceeded(2000 * inputScore);
    }

    getFishedResource() {
        let randomIndex = Math.round(Math.random() * (this.specialRewards.length - 1));
        return this.specialRewards[randomIndex];
    }

    switchFromGreenToGrayAnim() {
        this.ownerTool.inputDiv.classList.remove("anim_flash_green"); 
        this.setAmbientFlashState(true);
    }

    setAmbientFlashState(state) {
        if (state) {
            this.ownerTool.inputDiv.classList.add("anim_ambientFlash_gray"); 
        }
        else {
            this.ownerTool.inputDiv.classList.remove("anim_ambientFlash_gray"); 
        }
    }
}

//
// PowerBoundsComponent
//
class PowerBoundsComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.maxPower = 20.0;
        //this.powerDecay = 0.5;
        this.currentPower = 0.0;
        //this.maxPowerInputScore = 3.0;
        this.powerBar = null;
        this.powerDisplay = null;
        this.powerBarVisualMultiplier = 30;
        this.currentGain = null;
        this.maxGain = null;
        this.customInputElement = null;

        this.powerBounds = [];

        this.addPower               = this.addPower.bind(this);
        this.getPowerAlpha          = this.getPowerAlpha.bind(this);
        this.initPowerUI            = this.initPowerUI.bind(this);
        this.updatePowerUI          = this.updatePowerUI.bind(this);
    }

    getUpgradeMembers() {
        return [
            new IdValue("powerDecay", 0.5),
            new IdValue("maxPowerInputScore", 10.0),
            new IdValue("minPowerBounds", 0.5),
            new IdValue("maxPowerBounds", 0.8),
            //new IdValue("autoClickUnlock", 1)
        ];
    }

    membersUpdated() {
        this.powerBounds = this.getPowerBounds();

        if (this.customInputElement != null) {
            CustomInputElement.setPowerBounds(this.customInputElement, this.powerBounds, this.maxPower);

            // if (this.getMember("autoClickUnlock") >= 2) {
            //     this.ownerTool.inputHandler.setAutoClickEnabled(true);
            // }
            // else {
            //     this.ownerTool.inputHandler.setAutoClickEnabled(false);
            // }
        }
    }

    getPowerBounds() {
        return [this.maxPower * this.getMember("minPowerBounds"), this.maxPower * this.getMember("maxPowerBounds")];
    }

    // Lifecycle functions
    activate(argObj) {
        this.membersUpdated();

        this.customInputElement = CustomInputElement.powerBounds(this.powerBounds, this.maxPower);
        this.powerBar = this.customInputElement.querySelector("#powerBoundsComponent_powerBar");
        this.powerDisplay = this.customInputElement.querySelector("#powerBoundsComponent_powerDisplay");
        this.currentGain = this.customInputElement.querySelector(".powerBoundsComponent_currentGain");
        this.maxGain = this.customInputElement.querySelector(".powerBoundsComponent_maxGain");
        this.initPowerUI();

        this.ownerTool.inputHandler.customInputElement = this.customInputElement;
        this.ownerTool.refreshInputHandle(this.addPower);

        argObj.inputDiv.classList.add("clickableGridElement");
        this.membersUpdated();
    }

    deactivate() {
        this.currentPower = 0.0;
    }

    tick(argObj) {
        this.currentPower = FunLib.clamp(this.currentPower - (this.getMember("powerDecay") * argObj.deltaTime), 0, this.maxPower);
        this.updatePowerUI();
        let inputScore = this.getPowerAlpha() * this.getMember("maxPowerInputScore") * argObj.deltaTime;

        if (inputScore != 0) {
            this.ownerTool.inputSucceeded(this.getPowerAlpha() * this.getMember("maxPowerInputScore") * argObj.deltaTime, true);
        }

        this.currentGain.innerHTML = ResourceManager.formatResource((this.getPowerAlpha() * this.getMember("maxPowerInputScore")).toFixed(2), 3) + SymbolDatabase.getSymbol("money");
        this.maxGain.innerHTML = ResourceManager.formatResource(this.getMember("maxPowerInputScore").toFixed(2), 3) + SymbolDatabase.getSymbol("money");
    }

    // Other functions
    addPower(inputScore) {
        this.currentPower = FunLib.clamp(this.currentPower + inputScore, 0, this.maxPower);

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);
    }

    getPowerAlpha() {
        if (this.currentPower < this.powerBounds[0]) {
            return this.currentPower / this.powerBounds[0];
        }
        else if (this.currentPower > this.powerBounds[1]) {
            return 1.0 - (this.currentPower - this.powerBounds[1]) / (this.maxPower - this.powerBounds[1]);
        }
        else {
            return 1.0;
        }
    }

    initPowerUI() {
        this.powerBar.min = 0;
        this.powerBar.max = this.maxPower * this.powerBarVisualMultiplier;
        this.updatePowerUI();
    }

    updatePowerUI() {
        this.powerBar.value = this.currentPower * this.powerBarVisualMultiplier;
        this.powerDisplay.textContent = Math.round(this.getPowerAlpha() * 100) + "%";
    }
}

//
// PowerChargeComponent
//
class PowerChargeComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.maxPower = 10.0;
        this.powerDecay = 0.5;
        this.currentPower = 0.0;
        this.powerBar = null;
        this.powerBarVisualMultiplier = 30;

        this.specialRewards = [new IdValue("SpecialSnowflake", 0), new IdValue("PrototypingWeeks", 4), new IdValue("LostSanity", 1)];

        this.addPower           = this.addPower.bind(this);
        this.initPowerUI        = this.initPowerUI.bind(this);
        this.updatePowerUI      = this.updatePowerUI.bind(this);
        this.maxPowerCharged    = this.maxPowerCharged.bind(this);
        this.getBonusResource   = this.getBonusResource.bind(this);
    }



    // Lifecycle functions
    activate(argObj) {
        let customInputElement = CustomInputElement.powerCharge();
        this.powerBar = customInputElement.querySelector("#powerChargeComponent_powerBar");
        this.initPowerUI();

        this.ownerTool.inputHandler.customInputElement = customInputElement;
        this.ownerTool.refreshInputHandle(this.addPower);
    }

    deactivate() {
        this.currentPower = 0.0;
        this.ownerTool.inputDiv.classList.remove("anim_flash_green");
    }

    tick(argObj) {
        if (this.currentPower === this.maxPower) {
            this.maxPowerCharged(1.0);
            this.currentPower = 0;
        }
        else {
            this.currentPower = FunLib.clamp(this.currentPower - (this.powerDecay * argObj.deltaTime), 0, this.maxPower);
        }

        this.updatePowerUI();
    }

    // Other functions
    addPower(inputScore) {
        this.currentPower = FunLib.clamp(this.currentPower + inputScore, 0, this.maxPower);
        this.ownerTool.inputDiv.classList.remove("anim_flash_green");
    }

    initPowerUI() {
        this.powerBar.min = 0;
        this.powerBar.max = this.maxPower * this.powerBarVisualMultiplier;
        this.updatePowerUI();
    }

    updatePowerUI() {
        this.powerBar.value = this.currentPower * this.powerBarVisualMultiplier;
    }

    maxPowerCharged(inputScore) {
        this.ownerTool.inputDiv.classList.add("anim_flash_green");
        this.ownerTool.targetBlock.resourceRewards.push(this.getBonusResource());
        this.ownerTool.inputSucceeded(2000 * inputScore);
    }

    getBonusResource() {
        let randomIndex = Math.round(Math.random() * (this.specialRewards.length - 1));
        return this.specialRewards[randomIndex];
    }
}

//
// CorrectStreakComponent
//
class CorrectStreakComponent extends ToolComponent {
    
    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.currentRecord = 0;
        this.currentScore = 0;
        this.punishmentFraction = 0.1;
        this.decayMultiplier = 0.33;

        this.cycleInputState = 0; // 0 - no input; 1 - succeeded; 2 - failed

        this.clickStrengthDisplay = null;
        this.clickStrengthRecord = null;
        this.displayContainer = null;
        this.progressSlider = null;

        this.punchCardActive = false;
        this.punchCardTriggered = false;
        this.punchCardSides = [];
        this.cardMembers = [];

        this.punchCardGenerationHandle = new TimerHandle(-1);
        this.progressSliderHandle = new TimerHandle(-1);

        this.cached_punchCardLength = 0;
        this.cached_memberGenerationSpeed = 0;
        this.cached_maxReward = 0;

        this.inputConfirmed         = this.inputConfirmed.bind(this);
    }

    getUpgradeMembers() {
        return [
            new IdValue("maxReward", 20),
            new IdValue("decaySpeedMultiplier", 1),
            new IdValue("punchCardLength", 4),
            new IdValue("memberGenerationSpeed", 1),
        ];
    }
    membersUpdated() {
    }

    updatePersonalData(personalData) {
        this.currentRecord = personalData["CorrectStreakComponent_currentRecord"];
        if (this.currentRecord == null || this.currentRecord == undefined) {
            this.currentRecord = 0;
        }
        this.updateRecord(this.currentRecord);
    }

    updateRecord(newRecord) {
        this.currentRecord = newRecord;
        this.clickStrengthRecord.innerHTML = ResourceManager.formatResource(this.currentRecord.toFixed(2), 3) + SymbolDatabase.getSymbol("encryption");

        // GameSave
        let personalData = this.ownerTool.personalData;
        personalData["CorrectStreakComponent_currentRecord"] = this.currentRecord;
        this.ownerTool.applySaveDataPropertyChange("personalData", personalData);
    }

    // Lifecycle functions
    activate(argObj) {
        this.membersUpdated();

        this.currentScore = 0.0;
        let customInputElement = CustomInputElement.correctStreak();
        this.clickStrengthDisplay = customInputElement.querySelector(".correctStreakComponent_clickStrengthDisplay");
        this.clickStrengthRecord = customInputElement.querySelector(".correctStreakComponent_clickStrengthRecord");
        this.displayContainer = customInputElement.querySelector(".correctStreakComponent_displayContainer");
        this.progressSlider = customInputElement.querySelector(".correctStreakComponent_progressSlider");

        this.progressSlider.min = 0;
        this.progressSlider.max = 100;
        this.progressSlider.value = 0;
        
        this.ownerTool.inputHandler.customInputElement = customInputElement;
        this.ownerTool.inputHandler.autoClickSpeed = 5;
        this.ownerTool.refreshInputHandle(this.inputConfirmed);

        TimerManager.setTimer(1, this.generateNewPunchCard.bind(this));
    }

    deactivate() {
        this.ownerTool.inputDiv.classList.remove("anim_flash_red");
        TimerManager.removeTimer(this.punchCardGenerationHandle);
        TimerManager.removeTimer(this.progressSliderHandle);
    }

    tick(argObj) {
        if (this.punchCardTriggered === true) {
            this.currentScore = FunLib.clamp(this.currentScore - (this.cached_maxReward * this.decayMultiplier * this.getMember("decaySpeedMultiplier") * argObj.deltaTime), 0, this.currentScore);
            this.updateProgressSlider(this.cached_maxReward, this.currentScore);

            if (this.currentScore <= 0) {
                this.punishPunchCard();
                this.generateNewPunchCard();
            }
        }
    }

    // Other functions
    inputConfirmed(inputScore) {
        if (this.punchCardActive === false) return;
        if (this.punchCardSides.length <= 0) return;
        
        this.ownerTool.inputDiv.classList.remove("anim_flash_red");
        void this.ownerTool.inputDiv.offsetHeight;

        if (this.punchCardTriggered === false) {
            this.triggerPunchCard();
        }

        if (this.ownerTool.inputHandler.autoClickEnabled === true && this.ownerTool.inputHandler.isAutoClickConfirmed === true) {
            this.progressPunchCard();
        }
        else {
            let currentSide = this.punchCardSides[this.punchCardSides.length - 1];
            if (currentSide === 0 && inputScore === 0
                || currentSide === 1 && inputScore === 2) {
                this.progressPunchCard();
            }
            else {
                this.punishPunchCard();
            }
        }   
    }
    
    generateNewPunchCard() {
        this.ownerTool.inputDiv.classList.remove("clickableGridElement");
        this.clickStrengthDisplay.parentNode.classList.remove("succeeded");
        this.clickStrengthRecord.parentNode.classList.remove("succeeded");
        TimerManager.removeTimer(this.punchCardGenerationHandle);
        TimerManager.removeTimer(this.progressSliderHandle);

        this.punchCardActive = false;
        this.punchCardTriggered = false;
        this.punchCardSides = [];
        this.cardMembers = [];

        this.displayContainer.innerHTML = "";
        void this.displayContainer.offsetHeight;

        this.cached_punchCardLength = Math.round(this.getMember("punchCardLength"));
        this.cached_memberGenerationSpeed = this.getMember("memberGenerationSpeed");
        this.cached_maxReward = this.getMember("maxReward");

        this.progressSliderHandle = TimerManager.setTimer(this.cached_memberGenerationSpeed * (this.cached_punchCardLength - 1), null, this.updateProgressSlider.bind(this));
        this.progressPunchCardGeneration(this.cached_punchCardLength, this.cached_punchCardLength);
    }
    progressPunchCardGeneration(currentMember, cardLength) {
        // if (currentMember <= 0) {
        //     this.punchCardGenerated();
        //     return;
        // }

        TimerManager.removeTimer(this.punchCardGenerationHandle);

        let side = Math.round(Math.random());
        let display = CustomInputElement.insertCorrectStreakDisplay(this.displayContainer, side, currentMember / cardLength);
        display.style["animation-duration"] = this.cached_memberGenerationSpeed + "s";

        this.punchCardSides.push(side);
        this.cardMembers.push(display);

        if (currentMember - 1 <= 0) {
            this.punchCardGenerated();
            return;
        }

        this.punchCardGenerationHandle = TimerManager.setTimer(this.cached_memberGenerationSpeed, function () { this.progressPunchCardGeneration(currentMember - 1, cardLength); }.bind(this));
    }
    punchCardGenerated() {
        TimerManager.removeTimer(this.punchCardGenerationHandle);
        TimerManager.removeTimer(this.progressSliderHandle);
        this.punchCardActive = true;

        this.updateProgressSlider(1, 1);

        this.ownerTool.inputDiv.classList.add("clickableGridElement");
    }

    progressPunchCard() {
        this.punchCardSides.pop();
        let display = this.cardMembers.pop();

        let animDuration = 0.2;
        display.classList.add("progressed");
        display.style["animation-duration"] = animDuration + "s";
        
        TimerManager.setTimer(animDuration, function () {
            display.remove();
        }.bind(this));

        if (this.punchCardSides.length <= 0) {
            this.punchCardWon();
        }
    }
    punishPunchCard() {
        this.ownerTool.inputDiv.classList.add("anim_flash_red");

        this.currentScore = FunLib.clamp(this.currentScore -  this.cached_maxReward * this.punishmentFraction, 0, this.currentScore);
        this.updateProgressSlider(this.cached_maxReward, this.currentScore);
    }
    triggerPunchCard() {
        this.punchCardTriggered = true;
        this.currentScore = this.cached_maxReward;
    }

    punchCardWon() {
        this.ownerTool.inputDiv.classList.remove("clickableGridElement");

        this.punchCardActive = false;
        this.punchCardTriggered = false;

        this.clickStrengthDisplay.parentNode.classList.add("succeeded");

        if (this.currentScore > this.currentRecord) {
            this.updateRecord(this.currentScore);
            this.clickStrengthRecord.parentNode.classList.add("succeeded");
        }
        this.ownerTool.giveRewards(1, [new IdValue("encryption", this.currentScore)], false);

        TimerManager.setTimer(1, this.generateNewPunchCard.bind(this));

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);
    }

    updateProgressSlider(totalValue, currentValue) {
        let fraction = currentValue / totalValue;
        this.progressSlider.value = Math.round(fraction * 100);

        this.currentScore = fraction * this.cached_maxReward;
        this.clickStrengthDisplay.innerHTML = ResourceManager.formatResource(this.currentScore.toFixed(2), 3) + SymbolDatabase.getSymbol("encryption");
    }
}

//
// AdSelloutComponent
//
class AdSelloutComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.customInputElement = null;

        this.cost = null;
        this.adSpeed = null;
        this.adResistance = null;
        this.adRevenue = null;

        this.spawnSelloutAd         = this.spawnSelloutAd.bind(this);
    }

    getUpgradeMembers() {
        return [
            new IdValue("cost", 1000),
            new IdValue("adSpeed", 0.2),
            new IdValue("adResistance", 0.5),
            new IdValue("adRevenue", 5),
        ];
    }

    // Lifecycle functions
    activate() {
        this.customInputElement = CustomInputElement.adSellout(this.spawnSelloutAd);

        this.ownerTool.inputHandler.customInputElement = this.customInputElement;
        this.ownerTool.refreshInputHandle(null);
        this.membersUpdated();

        this.cost = this.customInputElement.querySelector(".adSelloutComponent_statCost");
        this.adSpeed = this.customInputElement.querySelector(".adSelloutComponent_statSpeed");
        this.adResistance = this.customInputElement.querySelector(".adSelloutComponent_statResistance");
        this.adRevenue = this.customInputElement.querySelector(".adSelloutComponent_statRevenue");
    }

    // Other functions
    spawnSelloutAd() {
        if (GameManager.resourceManager.getResourceValue("money") < this.getMember("cost")) {
            GameManager.resourceManager.displayResourceInsufficient("money", this.interactionElement);
            return;
        }

        GameManager.resourceManager.applyResourceChange(new IdValue("money", -this.getMember("cost")), this.ownerTool.inputDiv, false, false, AnalyticsResource.quick("toolMaintenance", "toolName_" + GameData.getFancyToolName(this.ownerTool.id)));

        GameManager.gridInitializer.adCoverage.hostRandomSponsoredAd(this.getMember("adSpeed"), this.getMember("adResistance"), this.getMember("adRevenue"));   
    }

    membersUpdated() {
        if (this.customInputElement != null) {
            this.cost.innerHTML = 'Cost per ad: ' + ResourceManager.formatResource(this.getMember("cost"), 3) + " " + SymbolDatabase.getSymbol("money");
            this.adSpeed.textContent = 'Regen speed: ' + this.getMember("adSpeed") + '/sec';
            this.adResistance.textContent = 'Click effectiveness: ' + this.getMember("adResistance");
            this.adRevenue.innerHTML = 'Revenue: ' + ResourceManager.formatResource(this.getMember("adRevenue"), 3) + ' ' + SymbolDatabase.getSymbol("money") + '/sec';
        }
    }
}

//
// InvestementComponent
//
class InvestementComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.customInputElement = null;
        this.campaignInputElement = null;

        this.controlPointDecayDelay = 0.2;

        this.currentSessionLifetime = 0.0;
        this.currentControlPointTime = 0.0;
        this.sessionActive = false;
        this.pointMinigameActive = false;
        this.pointMinigameIndex = -1;
        this.controlPointPower = 1.0;

        this.controlPointMinigameDuration = 0;
        this.controlPointDecay = 2;
        this.passedControlPoints = 0;
        this.totalScore = 0.0;

        this.campaignCooldown = 15;

        this.campaignCache = {};

        this.controlPointLayout = {};

        this.chargeTimerBar = null;
        this.buyButton = null;
        this.cooldownText = null;
        this.cooldownDiv = null;
        this.cooldownHandle = new TimerHandle(-1);

        this.statDuration = null;
        this.statControlPoints = null;
        this.statControlPointCost = null;
        this.statMaxProfit = null;
        this.investEfficiency = null;
        this.efficiencyDisplay = null;
        this.campaignProgress = null;
        this.tool_hintDisplay = null;

        this.resetInputDiv          = this.resetInputDiv.bind(this);
        this.requestNewCampaign     = this.requestNewCampaign.bind(this);
        this.finishCampaign         = this.finishCampaign.bind(this);
        this.startPointMinigame     = this.startPointMinigame.bind(this);
        this.finishPointMinigame    = this.finishPointMinigame.bind(this);
        this.tryPointInvestement    = this.tryPointInvestement.bind(this);
    }

    getUpgradeMembers() {
        return [
            new IdValue("campaignDuration", 4),
            new IdValue("campaignControlPoints", 3),
            new IdValue("campaignControlPointCost", 60),
            new IdValue("campaignMaxProfit", 4000),
        ];
    }

    // Lifecycle functions
    activate(argObj) {
        this.customInputElement = CustomInputElement.investementSelection(this.requestNewCampaign);

        this.buyButton = this.customInputElement.querySelector(".investementComponent_buyButton");

        this.cooldownText = this.customInputElement.querySelector(".investementComponent_cooldownText");
        this.cooldownDiv = this.customInputElement.querySelector(".investementComponent_cooldownDiv");

        this.chargeTimerBar = this.customInputElement.querySelector(".investementComponent_chargeTimerBar");
        this.chargeTimerBar.min = 0;
        this.chargeTimerBar.max = this.campaignCooldown * 60;
        this.chargeTimerBar.value = this.chargeTimerBar.max;


        this.statDuration = this.customInputElement.querySelector(".investementComponent_statDuration");
        this.statControlPoints = this.customInputElement.querySelector(".investementComponent_statControlPoints");
        this.statControlPointCost = this.customInputElement.querySelector(".investementComponent_statControlPointCost");
        this.statMaxProfit = this.customInputElement.querySelector(".investementComponent_statMaxProfit");
        
        this.resetInputDiv();

        this.ownerTool.inputHandler.autoClickSupported = false;
    }

    deactivate() {
        TimerManager.removeTimer(this.cooldownHandle);
    }

    membersUpdated() {
        if (this.customInputElement != null) {
            this.statDuration.textContent = 'Hackathon duration: ' + this.getMember("campaignDuration") + " sec";
            this.statControlPoints.textContent = 'Competition stages: ' + Math.round( this.getMember("campaignControlPoints"));
            this.statControlPointCost.innerHTML = 'Effort per stage: ' + ResourceManager.formatResource(this.getMember("campaignControlPointCost"), 3) + " " + SymbolDatabase.getSymbol("encryption");
            this.statMaxProfit.innerHTML = 'Max prize: ' + ResourceManager.formatResource(this.getMember("campaignMaxProfit"), 3) + " " + SymbolDatabase.getSymbol("money");
        }
    }

    tick(argObj) {
        let campaignDuration = this.campaignCache.campaignDuration;
        
        if (this.sessionActive) {
            this.currentSessionLifetime = FunLib.clamp(this.currentSessionLifetime + argObj.deltaTime, 0.0, campaignDuration);

            // Point minigame
            if (!this.pointMinigameActive) {
                if (this.passedControlPoints < this.campaignCache.campaignControlPoints) {
                    let nextPointIndex = this.passedControlPoints;
                    let pointTreshold = this.campaignCache.campaignDuration * this.controlPointLayout[nextPointIndex] - this.controlPointDecayDelay * 0.25; //(this.controlPointMinigameDuration + this.controlPointDecayDelay) * nextPointIndex;

                    if (this.currentSessionLifetime >= pointTreshold) {
                        this.startPointMinigame(nextPointIndex);
                    }
                }
            }
            else {
                this.currentControlPointTime += argObj.deltaTime;

                if (this.currentControlPointTime >= this.controlPointDecayDelay * 1.25) {
                    this.controlPointPower -= this.controlPointDecay * argObj.deltaTime; //= FunLib.clamp(1 - ((this.currentControlPointTime - this.controlPointDecayDelay) / this.controlPointMinigameDuration), 0.0, 1.0);
                }

                let tempTotalScore = FunLib.clamp(this.totalScore - (1 - this.controlPointPower) / this.campaignCache.campaignControlPoints, 0, 1);
                this.investEfficiency.value = tempTotalScore * this.investEfficiency.max;

                this.efficiencyDisplay.innerHTML = 'Current prize: ' + ResourceManager.formatResource(Math.round(tempTotalScore * this.campaignCache.campaignMaxProfit), 3) + SymbolDatabase.getSymbol("money");

                if (this.controlPointPower <= 0.9 && this.ownerTool.inputHandler.isAutoClickAvailable() && this.ownerTool.inputHandler.isAutoClickConfirmed === true) {
                    this.finishPointMinigame();
                }
            }

            // Session
            this.campaignProgress.max = campaignDuration * 30;
            this.campaignProgress.min = 0;
            this.campaignProgress.value = (this.currentSessionLifetime) * 30;

            if (this.currentSessionLifetime >= campaignDuration) {
                this.finishCampaign();
                return;
            }
        }  
    }

    // Other functions
    resetInputDiv() {
        this.ownerTool.inputHandler.customInputElement = this.customInputElement;
        this.ownerTool.refreshInputHandle(null);
        this.membersUpdated();
    }

    requestNewCampaign() {
        if (this.sessionActive == true) return;
        this.campaignCache.campaignDuration = this.getMember("campaignDuration");
        this.campaignCache.campaignControlPoints = Math.round( this.getMember("campaignControlPoints"));
        this.campaignCache.campaignControlPointCost = this.getMember("campaignControlPointCost");
        this.campaignCache.campaignMaxProfit = this.getMember("campaignMaxProfit");
        this.controlPointMinigameDuration = this.campaignCache.campaignDuration / (this.campaignCache.campaignControlPoints + 1) - this.controlPointDecayDelay;

        let layouts = [];
        for (let index = 0; index < this.campaignCache.campaignControlPoints; index++) {
            let layout = Math.random() * 0.80 + 0.15;
            layout = Math.round(layout / 0.1) * 0.1;

            if (layouts.includes(layout)) {
                index--;
                continue;
            }

            layouts.push(layout);
        }
        layouts.sort(function(a,b) { return a - b; });
        
        for (let index = 0; index < layouts.length; index++) {
            this.controlPointLayout[index] = layouts[index];
        }

        this.campaignInputElement = CustomInputElement.investementCampaign(this.campaignCache.campaignControlPoints, this.controlPointLayout);
        this.investEfficiency = this.campaignInputElement.querySelector(".investementComponent_investEfficiency");
        this.efficiencyDisplay = this.campaignInputElement.querySelector(".investementComponent_investEfficiencyDisplay");
        this.campaignProgress = this.campaignInputElement.querySelector(".investementComponent_campaignProgress");
        this.tool_hintDisplay = this.campaignInputElement.querySelector(".tool_hintDisplay");

        this.ownerTool.inputHandler.customInputElement = this.campaignInputElement;
        this.ownerTool.refreshInputHandle(null);
        this.membersUpdated();
        
        this.sessionActive = true;

        this.totalScore = 1.0;
        this.passedControlPoints = 0;

        this.investEfficiency.max = 600;
        this.investEfficiency.value = this.investEfficiency.max;
        this.efficiencyDisplay.innerHTML = 'Current prize: ' + ResourceManager.formatResource(Math.round(this.totalScore * this.campaignCache.campaignMaxProfit), 3) + SymbolDatabase.getSymbol("money");

        this.ownerTool.inputDiv.classList.add("clickableGridElement");

        this.ownerTool.inputHandler.autoClickSupported = true;
    }

    finishCampaign() {
        if (this.sessionActive == false) return;
        this.finishPointMinigame();

        this.sessionActive = false;
        this.currentSessionLifetime = 0.0;

        this.totalScore = Math.floor(this.totalScore * 100) / 100;

        this.resetInputDiv();
        this.ownerTool.inputDiv.classList.remove("clickableGridElement");
 
        if (this.totalScore > 0) {
            this.ownerTool.giveRewards(1, [new IdValue("money", Math.ceil(this.campaignCache.campaignMaxProfit * this.totalScore))], false)
            this.ownerTool.inputDiv.classList.remove("succeededFull");
            void this.ownerTool.inputDiv.offsetHeight;
            this.ownerTool.inputDiv.classList.add("succeededFull");
        }

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);

        this.buyButton.classList.add("hidden");
        this.cooldownDiv.classList.remove("hidden");

        this.ownerTool.inputHandler.autoClickSupported = false;

        this.cooldownHandle = TimerManager.setTimer(this.campaignCooldown, function() {
            this.buyButton.classList.remove("hidden");
            this.cooldownDiv.classList.add("hidden");
        }.bind(this),
        function(lifespan, lifetime) {
            this.chargeTimerBar.value = (1 - lifetime / lifespan) * this.chargeTimerBar.max;
            this.cooldownText.textContent = "Next Hackathon in: " + Math.ceil(lifespan - lifetime);
        }.bind(this));
    }

    startPointMinigame(pointIndex) {
        if (this.pointMinigameActive) return;

        this.pointMinigameActive = true;
        this.controlPointPower = 1.0;
        this.currentControlPointTime = 0.0;
        this.pointMinigameIndex = pointIndex;

        this.campaignInputElement.classList.remove("succeededFull_dim");
        this.campaignInputElement.classList.add("anim_quickFlash_blue");
        this.tool_hintDisplay.classList.add("hintDisplayBlink");
        this.campaignInputElement.addEventListener("click", this.tryPointInvestement);
    }

    finishPointMinigame() {
        if (!this.pointMinigameActive) return;

        this.passedControlPoints++;
        this.totalScore -= (1 - this.controlPointPower) / this.campaignCache.campaignControlPoints;

        this.pointMinigameActive = false;
        this.pointMinigameIndex = -1;
        this.campaignInputElement.classList.remove("anim_quickFlash_blue");
        this.tool_hintDisplay.classList.remove("hintDisplayBlink");
        this.campaignInputElement.removeEventListener("click", this.finishPointMinigame);

        this.campaignInputElement.classList.add("succeededFull_dim");
    }

    tryPointInvestement() {
        if (!this.pointMinigameActive) return;
        let cost = this.campaignCache.campaignControlPointCost;
        if (GameManager.resourceManager.getResourceValue("encryption") < cost) {
            GameManager.resourceManager.displayResourceInsufficient("encryption", this.ownerTool.inputDiv);
            return;
        }

        GameManager.resourceManager.applyResourceChange(new IdValue("encryption", -cost), this.ownerTool.inputDiv, false, false, AnalyticsResource.quick("toolMaintenance", "toolName_" + GameData.getFancyToolName(this.ownerTool.id)));

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("resourcesSpent", new IdValue("encryption", cost));

        this.finishPointMinigame();
    }
}

//
// PassiveIncomeComponent
//
class PassiveIncomeComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.customInputElement = null;

        this.activeFreelancers = 0;

        this.spawnHandle = new TimerHandle(-1);

        this.activeCoresElement = null;
        this.statCostElement = null;
        this.statRevenueElement = null;
        this.sliderElement = null;
        this.unavailableElement = null;
        this.cooldownText = null;

        this.hireFreelancer = this.hireFreelancer.bind(this);
        this.gridUpdated = this.gridUpdated.bind(this);
    }

    getUpgradeMembers() {
        return [
            new IdValue("coreCost", 1000),
            new IdValue("reward_min", 0.3),
            new IdValue("reward_max", 0.4),
            new IdValue("cooldown", 90),
        ];
    }

    // Lifecycle functions
    activate(argObj) {
        this.customInputElement = CustomInputElement.passiveIncome(function () { this.hireFreelancer(false); }.bind(this));
        this.ownerTool.inputHandler.customInputElement = this.customInputElement;
        this.ownerTool.refreshInputHandle(null);

        this.ownerTool.inputHandler.autoClickSupported = false;

        this.activeCoresElement = this.customInputElement.querySelector(".passiveIncomeComponent_statActiveAmount");
        this.statCostElement = this.customInputElement.querySelector(".passiveIncomeComponent_statCost");
        this.statRevenueElement = this.customInputElement.querySelector(".passiveIncomeComponent_statRevenue");
        this.sliderElement = this.customInputElement.querySelector(".inputBar");
        this.unavailableElement = this.customInputElement.querySelector(".passiveIncomeComponent_timerUnavailable");
        this.cooldownText = this.customInputElement.querySelector(".passiveIncomeComponent_statTotalRevenue");

        this.sliderElement.min = 0;
        this.sliderElement.max = 1000;
        this.sliderElement.value = 0;

        this.membersUpdated();

        GameManager.gridInitializer.gridManager.gridUpdatedCallbacks.push(this.gridUpdated);
    }

    deactivate() {
        TimerManager.removeTimer(this.spawnHandle);
        FunLib.removeFromArray(GameManager.gridInitializer.gridManager.gridUpdatedCallbacks, this.gridUpdated);
    }

    membersUpdated() {
        if (this.customInputElement != null) {
            this.activeCoresElement.innerHTML = "Active cores: " + this.activeFreelancers;
            this.statCostElement.innerHTML = "Cost per core: " + ResourceManager.formatResource(Math.ceil(this.getMember("coreCost")), 3) + " " + SymbolDatabase.getSymbol("money");

            let minReward = ResourceManager.formatResource(GameManager.resourceManager.getLevelReq("adStrike", this.getMember("reward_min"), 3));
            let maxReward = ResourceManager.formatResource(GameManager.resourceManager.getLevelReq("adStrike", this.getMember("reward_max"), 3));

            this.statRevenueElement.innerHTML = "Spawn reward: " + minReward + " - " + maxReward + " " + SymbolDatabase.getSymbol("adStrike");
        }

        if (TimerManager.isTimerActive(this.spawnHandle)) {
            TimerManager.setTimerLifespan(this.spawnHandle, this.getMember("cooldown"), false);
        }
    }

    updatePersonalData(personalData) {
        let newFreelancerAmount = personalData["PassiveIncomeComponent_activeFreelancers"];
        if (newFreelancerAmount == null || newFreelancerAmount == undefined) {
            newFreelancerAmount = 0;
        }

        // GameSave
        this.ownerTool.resetSaveDataProperty("useCycles");

        this.activeFreelancers = 0;
        for (let index = 1; index <= newFreelancerAmount; index++) {
            this.hireFreelancer(true);
        }
    }

    tick(argObj) {
    }

    // Other functions
    hireFreelancer(bypassResourceCheck) {
        if (bypassResourceCheck == undefined || bypassResourceCheck === false) {

            let cost = this.getMember("coreCost");
            if (GameManager.resourceManager.getResourceValue("money") < cost) {
                GameManager.resourceManager.displayResourceInsufficient("money", this.ownerTool.inputDiv);
                return;
            }
            GameManager.resourceManager.applyResourceChange(new IdValue("money", -cost), this.ownerTool.inputDiv, false, false, AnalyticsResource.quick("toolMaintenance", "toolName_" + GameData.getFancyToolName(this.ownerTool.id)));

            // GameSave
            this.ownerTool.applySaveDataPropertyChange("resourcesSpent", new IdValue("money", cost));
        }

        this.activeFreelancers++;
        GameManager.upgradeManager.updateToolMembers(this.ownerTool.id, [new IdValue("coreCost", 2)]);
        GameManager.upgradeManager.updateToolMembers(this.ownerTool.id, [new IdValue("reward_min", 1.05)]);
        GameManager.upgradeManager.updateToolMembers(this.ownerTool.id, [new IdValue("reward_max", 1.04)]);
        this.membersUpdated();
        
        // GameSave
        let personalData = this.ownerTool.personalData;
        personalData["PassiveIncomeComponent_activeFreelancers"] = this.activeFreelancers;
        this.ownerTool.applySaveDataPropertyChange("personalData", personalData);

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);

        if (TimerManager.isTimerActive(this.spawnHandle) == false) {
            this.scheduleNextSpawn();
        }
    }

    scheduleNextSpawn() {
        if (this.activeFreelancers <= 0) return;
        if (GameManager.gridInitializer.gridManager.getCells_NoTools([]).length <= 0) {
            this.sliderElement.classList.add("hidden");
            this.unavailableElement.classList.remove("hidden");
            return;
        }

        this.sliderElement.classList.remove("hidden");
        this.unavailableElement.classList.add("hidden");

        TimerManager.removeTimer(this.spawnHandle);
        this.spawnHandle = TimerManager.setTimer(this.getMember("cooldown"), this.spawnSurprise.bind(this), this.updateSlider.bind(this));
    }
    spawnSurprise() {
        let freeCells = GameManager.gridInitializer.gridManager.getCells_Empty();
        let chosenCell = freeCells[Math.round(Math.random() * (freeCells.length - 1))];
        if (chosenCell == undefined || chosenCell == null) {
            let freeCells = GameManager.gridInitializer.gridManager.getCells_NoTools([]);
            chosenCell = freeCells[Math.round(Math.random() * (freeCells.length - 1))];
        }

        if (chosenCell != undefined && chosenCell != null) {

            this.sliderElement.classList.remove("hidden");
            this.unavailableElement.classList.add("hidden");

            let bounds = [chosenCell.coord.x, chosenCell.coord.y, chosenCell.coord.x + 1, chosenCell.coord.y + 1];
            let priceLevel = FunLib.lerpNumber(Math.random(), this.getMember("reward_min"), this.getMember("reward_max"));
            let progressionCallback = function (gridElement, inputScore, resourcegridElementValue, isTickBased) { GameManager.progressionRequest(gridElement, inputScore, resourcegridElementValue, isTickBased); }

            let tool = new ToolGridElement(
                bounds,
                GameData.constructTool(11, progressionCallback, [[new IdValue("adStrike", GameManager.resourceManager.getLevelReq("adStrike", priceLevel, true))]]),
                null,
                []
            );
            GameManager.gridInitializer.toolCoverage.initTool(tool);
            tool.setCoveringAd(null);

            // Animation for when covered by ad
            let spawnHint = document.createElement("div");
            spawnHint.classList.add("passiveIncomeComponent_spawnHint");
            spawnHint.style["grid-area"] = tool.layoutElement.style["grid-area"];

            TimerManager.setTimer(5, function () { spawnHint.remove(); }.bind(this));
            document.getElementById("mainGridContainer").appendChild(spawnHint);

            //GameManager.saveGame();

            this.ownerTool.inputDiv.classList.remove("succeededFull");
            void this.ownerTool.inputDiv.offsetHeight;
            this.ownerTool.inputDiv.classList.add("succeededFull");
            tool.interactionElement.classList.add("supriseSpawnedFromAI");

            this.scheduleNextSpawn();
        }
        else {
            this.sliderElement.classList.add("hidden");
            this.unavailableElement.classList.remove("hidden");
        }       
    }
    updateSlider(lifespan, lifetime) {
        this.sliderElement.value = (1 - lifetime / lifespan) * 1000;
        this.cooldownText.textContent = "Next spawn in: " +  Math.ceil(lifespan - lifetime);
    }

    gridUpdated() {
        if (TimerManager.isTimerActive(this.spawnHandle) === true) return;
        if (GameManager.gridInitializer.gridManager.getCells_NoTools([]).length <= 0) return;

        this.scheduleNextSpawn();
    }
}

//
// ResourceExchangeComponent
//
class ResourceExchangeComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.exchangeResources = new Map();
        this.exchangeResources.set("money", { resourceId: "money", value: 0, baseRate: 1, boundSlider: null });
        this.exchangeResources.set("adStrike", { resourceId: "adStrike", value: 0, baseRate: 2, boundSlider: null  });
        this.exchangeResources.set("encryption", { resourceId: "encryption", value: 0, baseRate: 100, boundSlider: null  });

        this.selections = new Map();
        this.selections.set("sell", "money");
        this.selections.set("buy", "money");

        this.resourceSliders = null;
        this.exchangeButton = null;
        this.selectionHint = null;
        this.exchangeResourceSelectors = [];

        //this.redrawRequestFrames = 0;
        this.exchangeActive = false;

        this.favorMultiplier = 2;
   
        this.exchange                   = this.exchange.bind(this);
        this.valueChanged               = this.valueChanged.bind(this);
        this.recalculateExchange        = this.recalculateExchange.bind(this);
        this.getRatedResourceValue      = this.getRatedResourceValue.bind(this);
        this.clampRequestToResources    = this.clampRequestToResources.bind(this);
        this.selectorChoosen            = this.selectorChoosen.bind(this);
    }

    getUpgradeMembers() {
        return [
            new IdValue("conversionRate", 1),
            new IdValue("baseLimit", 5000),
            new IdValue("exchangeSpeed", 600),
        ];
    }

    // Lifecycle functions
    activate(argObj) {
        this.customInputElement = CustomInputElement.resourceExchange(this.exchangeResources, this.exchange, this.selectorChoosen);
        this.ownerTool.inputHandler.customInputElement = this.customInputElement;
        this.ownerTool.refreshInputHandle(null);
        this.ownerTool.inputHandler.autoClickSupported = false;
        this.membersUpdated();

        this.resourceSliders = this.customInputElement.querySelector(".resourceExchangeComponent_resourceSliders");
        this.exchangeButton = this.customInputElement.querySelector(".resourceExchangeComponent_exchangeButton");
        this.selectionHint = this.customInputElement.querySelector(".resourceExchangeComponent_selectionHint");
        for (let selector of this.customInputElement.querySelectorAll(".exchangeResourceSelector")) {
            this.exchangeResourceSelectors.push(selector);
        }
    }

    tick(argObj) {
        // if (this.redrawRequestFrames === 0) {
        //     this.membersUpdated();
        //     this.redrawRequestFrames = -1;
        // }
        // else if (this.redrawRequestFrames > 0) {
        //     this.redrawRequestFrames--;
        // }

        if (this.exchangeActive) {
            let updatedAnyValue = false;

            for (let resourceId of this.exchangeResources.keys()) {
                let exchange = this.exchangeResources.get(resourceId);
                if (exchange.boundSlider == null || exchange.value == 0) continue;

                // set speed
                let exchangeSpeed = this.convertRatedValueToResource(resourceId, this.getMember("exchangeSpeed"), exchange.value < 0) * argObj.deltaTime;
                if (exchangeSpeed >= Math.abs(exchange.value)) {
                    exchangeSpeed = Math.abs(exchange.value);
                }

                // apply value delta to exchange
                if (exchange.value > 0) {
                    exchange.value = FunLib.clamp(exchange.value - exchangeSpeed, 0, exchange.value);

                    this.ownerTool.giveRewards(1, [new IdValue(resourceId, exchangeSpeed)], true)

                }
                else {
                    // eat all resources on first call (perhaps a temp solution?)
                    exchangeSpeed = -exchange.value;

                    exchange.value = FunLib.clamp(exchange.value + exchangeSpeed, exchange.value, 0);
                    GameManager.resourceManager.applyResourceChange(new IdValue(resourceId, -exchangeSpeed), this.ownerTool.inputDiv, false, false, AnalyticsResource.quick("toolMaintenance", "toolName_" + GameData.getFancyToolName(this.ownerTool.id)));

                    // GameSave
                    this.ownerTool.applySaveDataPropertyChange("resourcesSpent", new IdValue(resourceId, exchangeSpeed));
                }

                exchange.boundSlider.setAttribute("value", Math.round(exchange.value));
                updatedAnyValue = true;
            }

            if (!updatedAnyValue) {
                this.finishExchange();
            }
        }
    }

    membersUpdated() {
        if (this.exchangeActive) return;

        let baseLimit = this.getMember("baseLimit");

        for (let resourceId of this.exchangeResources.keys()) {
            let exchange = this.exchangeResources.get(resourceId);
            this.initializeExchangeSlider(exchange);
        }
        // update received resources to new rates
    }

    // Other functions
    exchange() {
        if (this.clampRequestToResources()) return;

        this.exchangeActive = true;

        for(let resourceId of this.exchangeResources.keys()) {
            let exchange = this.exchangeResources.get(resourceId);
            if (exchange.boundSlider == null) continue;
            exchange.boundSlider.setDisabled(true);
        }

        this.exchangeButton.disabled = true;

        for (let selector of this.exchangeResourceSelectors) {
            selector.classList.add("disabled");
        }

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);
    }
    finishExchange() {
        this.exchangeActive = false;

        for (let resourceId of this.exchangeResources.keys()) {
            let exchange = this.exchangeResources.get(resourceId);
            if (exchange.boundSlider == null) continue;
            exchange.boundSlider.setDisabled(false);
        }

        this.exchangeButton.disabled = false;

        for (let selector of this.exchangeResourceSelectors) {
            selector.classList.remove("disabled");
        }

        this.membersUpdated();

        this.ownerTool.inputDiv.classList.remove("succeededFull");
        void this.ownerTool.inputDiv.offsetHeight;
        this.ownerTool.inputDiv.classList.add("succeededFull");
    }

    valueChanged(e) {
        let exchange = this.exchangeResources.get(e.detail.id);
        exchange.value = e.detail.value;
        
        this.recalculateExchange(e.detail.id);
    }

    selectorChoosen(e, type, resourceId) {
        let selectors = this.customInputElement.querySelectorAll(".exchangeResourceSelector");
        for (let selector of selectors) {
            if (selector.getAttribute("selectortype") == type) {
                let displays = selector.querySelectorAll(".exchangeResourceSelector_selectorDisplayChoice");

                for (let display of displays) {
                    display.innerHTML = SymbolDatabase.getSymbol(resourceId);
                }
                break;
            }
        }

        this.selections.set(type, resourceId);

        if (this.selections.get("sell") != this.selections.get("buy")) {
            this.showSelectionUI();
        }
        else {
            this.hideSelectionUI();
        }
    }
    showSelectionUI() {
        this.resourceSliders.innerHTML = "";
        void this.resourceSliders.offsetHeight;

        for (let resourceId of this.exchangeResources.keys()) {
            let exchange = this.exchangeResources.get(resourceId);
            exchange.boundSlider = null;
            exchange.value = 0;
        }

        let selectedExchangeResources = new Map();
        let sellExchange = this.exchangeResources.get(this.selections.get("sell"));
        let buyExchange = this.exchangeResources.get(this.selections.get("buy"));
        selectedExchangeResources.set(this.selections.get("sell"), sellExchange);
        selectedExchangeResources.set(this.selections.get("buy"), buyExchange);
        CustomInputElement.exchangeResourceSliders(selectedExchangeResources, this.valueChanged);

        for (let resourceId of selectedExchangeResources.keys()) {
            let exchange = selectedExchangeResources.get(resourceId);
            this.resourceSliders.append(exchange.boundSlider);
            this.initializeExchangeSlider(exchange);
        }

        this.resourceSliders.classList.remove("hidden");
        this.exchangeButton.classList.remove("hidden");
        this.selectionHint.classList.add("hidden");

        //this.redrawRequestFrames = 2;
    }
    initializeExchangeSlider(exchange) {
        if (exchange.boundSlider == null) return;

        let baseLimit = this.getMember("baseLimit");
        let limit = this.convertRatedValueToResource(exchange.resourceId, baseLimit, exchange.value < 0);
        exchange.boundSlider.setBounds(-limit, limit);
        exchange.boundSlider.setAttribute("value", 0);
    }
    hideSelectionUI() {
        this.resourceSliders.classList.add("hidden");
        this.exchangeButton.classList.add("hidden");
        this.selectionHint.classList.remove("hidden");
    }

    recalculateExchange(selectedResourceId) {
        let valueToTrade = 0;
        let anotherId = null;
        let anotherExchange = null;
        let smallestRateExchange = null;
        let biggestRateExchange = null;

        for (let resourceId of this.exchangeResources.keys()) {
            let exchange = this.exchangeResources.get(resourceId);
            if (exchange.boundSlider == null) continue;

            if (smallestRateExchange == null) {
                smallestRateExchange = exchange;
            }
            else if (exchange.baseRate < smallestRateExchange.baseRate) {
                smallestRateExchange = exchange;
            }
            if (biggestRateExchange == null) {
                biggestRateExchange = exchange;
            }
            else if (exchange.baseRate > biggestRateExchange.baseRate) {
                biggestRateExchange = exchange;
            }

            if (resourceId == selectedResourceId) {
                if (exchange.value < 0) {
                    let limit = this.convertRatedValueToResource(resourceId, this.getMember("baseLimit") * this.favorMultiplier)
                    exchange.boundSlider.setBounds(-limit, limit);
                    valueToTrade = this.getRatedResourceValue(resourceId, exchange.value / this.favorMultiplier);
                }
                else {
                    let limit = this.convertRatedValueToResource(resourceId, this.getMember("baseLimit"))
                    exchange.boundSlider.setBounds(-limit, limit);
                    valueToTrade = this.getRatedResourceValue(resourceId, exchange.value);
                }
            }
            else {
                anotherId = resourceId;
                anotherExchange = exchange;
            }
        }

        if (anotherExchange.value < 0) {
            let limit = this.convertRatedValueToResource(anotherExchange.resourceId, this.getMember("baseLimit") * this.favorMultiplier)
            anotherExchange.boundSlider.setBounds(-limit, limit);
            anotherExchange.boundSlider.setValue(-this.convertRatedValueToResource(anotherId, valueToTrade * this.favorMultiplier));
        }
        else {
            let limit = this.convertRatedValueToResource(anotherExchange.resourceId, this.getMember("baseLimit"))
            anotherExchange.boundSlider.setBounds(-limit, limit);
            anotherExchange.boundSlider.setValue(-this.convertRatedValueToResource(anotherId, valueToTrade));
        }

        /*
        let ratedBiggestValue = this.getRatedResourceValue(biggestRateExchange.resourceId, biggestRateExchange.value);
        let convertedToSmallest = -this.convertRatedValueToResource(smallestRateExchange.resourceId, ratedBiggestValue);
        if (smallestRateExchange.value != convertedToSmallest) {
            smallestRateExchange.boundSlider.setValue(convertedToSmallest);
        }
        */
    }

    getRatedResourceValue(resourceId, value) {
        let exchange = this.exchangeResources.get(resourceId);
        return Math.ceil(value * exchange.baseRate * this.getMember("conversionRate"));
    }

    convertRatedValueToResource(resourceId, ratedValue) {
        let exchange = this.exchangeResources.get(resourceId);
        return Math.ceil(ratedValue / (exchange.baseRate * this.getMember("conversionRate")));
    }

    clampRequestToResources() {
        let clampingWasMade = false;

        for (let resourceId of this.exchangeResources.keys()) {
            let exchange = this.exchangeResources.get(resourceId);
            if (exchange.boundSlider == null || exchange.value >= 0) continue;

            let resourceValue = GameManager.resourceManager.getResourceValue(resourceId);
            if (resourceValue < Math.abs(exchange.value)) {
                GameManager.resourceManager.displayResourceInsufficient(resourceId, this.ownerTool.inputDiv);
                
                exchange.boundSlider.setValue(-Math.floor(resourceValue));
                clampingWasMade = true;
                break;
            }
        }

        return clampingWasMade;
    }
}

//
// SurpriseMechanicComponent
//
class SurpriseMechanicComponent extends ToolComponent {
    constructor(execOrderOverrides, rewards) {
        super(execOrderOverrides);

        this.customInputElement = null;
        this.progressDiv = null;

        this.rewards = rewards // IdValue[]
        this.holdTimeRequirement = 3.0;
        this.currentHoldTime = 0.0;
        this.holdActive = false;
    
        this.startHold      = this.startHold.bind(this);
        this.cancelHold     = this.cancelHold.bind(this);
        this.finish         = this.finish.bind(this);
        this.setProgressDiv = this.setProgressDiv.bind(this);
    }

    // Lifecycle functions
    activate(argObj) {
        this.customInputElement = CustomInputElement.surpriseMechanic(this.startHold, this.cancelHold, this.rewards);
        this.ownerTool.inputHandler.customInputElement = this.customInputElement;
        this.ownerTool.refreshInputHandle(null);
        
        argObj.inputDiv.classList.add("clickableGridElement");

        let personalData = this.ownerTool.personalData;
        personalData["SurpriseMechanicComponent_rewards"] = this.rewards;
        this.ownerTool.applySaveDataPropertyChange("personalData", personalData);

        this.progressDiv = this.customInputElement.querySelector(".surpriseMechanicComponent_progress");
        this.setProgressDiv(0);
    }

    tick(argObj) {
        if (this.holdActive) {
            this.currentHoldTime = FunLib.clamp(this.currentHoldTime + argObj.deltaTime, 0.0, this.holdTimeRequirement);

            let progress = 100 * (this.currentHoldTime / this.holdTimeRequirement);
            this.setProgressDiv(progress);

            if (this.currentHoldTime >= this.holdTimeRequirement) {
                this.finish();
            }
        }   
    }

    // Other functions
    startHold() {
        if (this.holdActive) return;

        this.holdActive = true;
        this.currentHoldTime = 0.0;
    }

    cancelHold() {
        if (!this.holdActive) return;

        this.setProgressDiv(0);
        this.holdActive = false;
    }

    finish() {
        this.ownerTool.giveRewards(1.0, this.rewards);   

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);

        GameManager.gridInitializer.toolCoverage.removeTool(this.ownerTool);
    }

    setProgressDiv(progress) {
        this.progressDiv.style["width"] = progress + "%";
    }
}

//
// LockedStateComponent
//
class LockedStateComponent extends ToolComponent {

    constructor(execOrderOverrides, resourceRoles, lockedToolId) {
        super(execOrderOverrides);

        this.resourceRoles = resourceRoles; // String[]
        this.rewards = [];
        this.lockedToolId = lockedToolId;
        this.lockedTool = null;

        this.additionalLock = false;

        this.autoTime = 0.5;
        this.currentAutoTime = 0.0;

        this.setAdditionalLock = this.setAdditionalLock.bind(this);
    }

    // Lifecycle functions
    activate(argObj) {
        let toolName = GameData.getFancyToolName(this.lockedToolId);
        if (this.lockedTool != null) {
            toolName = GameData.getFancyToolName(this.lockedTool.toolComponents[0].toolId);
        }
        argObj.inputDiv.appendChild(CustomInputElement.lockedTool(this.lockedToolId == 6, toolName));

        this.ownerTool.rewards = []; 
        for (let role of this.resourceRoles) {
            this.rewards.push(new IdValue(role, 1));
        }
    }

    tick(argObj) {
        if (this.additionalLock) return;

        this.currentAutoTime += argObj.deltaTime;
        if (this.currentAutoTime >= this.autoTime) {
            this.currentAutoTime = 0.0;
            this.inputSucceeded();
        }
    }

    inputSucceeded() {
        //this.ownerTool.giveRewards(1.0, this.rewards);       
    }

    setAdditionalLock(state) {
        if (this.additionalLock != state && !state) {
            this.inputSucceeded();
            this.currentAutoTime = 0;
        }
        this.additionalLock = state;
    }
}

//
// MainToolComponent
//
class MainToolComponent extends ToolComponent {

    constructor(execOrderOverrides) {
        super(execOrderOverrides);

        this.clicksPerSecondHandle = new TimerHandle(-1);
        this.maxClicksPerSecond = 12;
        this.clickCooldown = 1 / this.maxClicksPerSecond;
    }

    getUpgradeMembers() {
        return [
            new IdValue("strength", 1.0),
            //new IdValue("autoClickUnlock", 1),
        ];
    }

    membersUpdated() {
        // if (this.getMember("autoClickUnlock") >= 2) {
        //     this.ownerTool.inputHandler.setAutoClickEnabled(true);
        // }
        // else {
        //     this.ownerTool.inputHandler.setAutoClickEnabled(false);
        // }
    }

    // Lifecycle functions
    activate(argObj) {
        argObj.inputDiv.appendChild(CustomInputElement.mainTool());
        argObj.inputDiv.classList.add("clickableGridElement");

        this.membersUpdated();
    }

    deactivate() {
        TimerManager.removeTimer(this.clicksPerSecondHandle);
    }

    inputSucceeded() {
        if (TimerManager.isTimerActive(this.clicksPerSecondHandle)) {
            //console.log("Over the speed limit!");
            return;
        }

        this.clicksPerSecondHandle = TimerManager.setTimer(this.clickCooldown);
        GameManager.pushAdsBack(this.getMember("strength"));

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);

        this.ownerTool.giveRewards(1, [new IdValue("adStrike", 1)], false);
    }
}

//
// UpgradeComponent
//
class UpgradeComponent extends ToolComponent {

    constructor(execOrderOverrides, toolId, boundUpgradesList) {
        super(execOrderOverrides);

        this.upgradeManager = null;
        this.customInputElement = null;
        this.toolId = toolId;
        this.boundUpgradesList = boundUpgradesList;
        if (this.boundUpgradesList == null || this.boundUpgradesList == undefined) {
            this.boundUpgradesList = [];
        }

        this.upgradeListContainer = null;
        this.upgradeList = null;
        this.selfLayout = null;
        this.toolLayout = null;
        this.toolHintText = null;
        this.availableUpgradesText = null;
        this.availableUpgradesPostfixText = null;

        this.selfGridBounds = [];
        this.toolGridBounds = [];

        this.showUpgradeList            = this.showUpgradeList.bind(this);
        this.hideUpgradeList            = this.hideUpgradeList.bind(this);
        this.resetUpgradeListSize       = this.resetUpgradeListSize.bind(this);
        this.upgradeBecameAvailable     = this.upgradeBecameAvailable.bind(this);
        this.upgradeBecameActive        = this.upgradeBecameActive.bind(this);

        this.windowResized = this.windowResized.bind(this);
    }

    // Lifecycle functions
    activate() {        
        this.customInputElement = CustomInputElement.upgrade(GameData.getFancyToolName(this.toolId), this.hideUpgradeList);

        this.ownerTool.inputHandler.customInputElement = this.customInputElement;
        this.ownerTool.refreshInputHandle(null);

        this.customInputElement.addEventListener("click", this.showUpgradeList);
        this.customInputElement.addEventListener("mouseleave", this.hideUpgradeList);

        this.upgradeListContainer = this.customInputElement.querySelector(".upgradeComponent_upgradeListContainer");
        this.upgradeList = this.customInputElement.querySelector(".upgradeComponent_upgradeList");
        this.toolHintText = this.customInputElement.querySelector(".upgradeComponent_toolHint");
        this.availableUpgradesText = this.customInputElement.querySelector(".upgradeComponent_availableUpgrades");
        this.availableUpgradesPostfixText = this.customInputElement.querySelector(".upgradeComponent_availableUpgradesPostfix");

        this.upgradeManager = GameManager.upgradeManager;
        this.upgradeManager.addCallback_upgradeAvailable(this.upgradeBecameAvailable);
        this.upgradeManager.addCallback_upgradeActive(this.upgradeBecameActive);

        this.ownerTool.inputDiv.classList.add("clickableGridElement");

       
        GameManager.globalEventListener.addGlobalListener("resize", this.windowResized);
    }

    deactivate() {
        GameManager.globalEventListener.removeGlobalListener("resize", this.windowResized);
    }

    windowResized(e) {
        this.resetUpgradeListSize();
    }

    // Other functions
    showUpgradeList(e) {
        for (let toolCover of GameManager.gridInitializer.toolCoverage.tools) {
            if (toolCover.ownedTool.id == this.toolId) {
                this.toolLayout = toolCover.layoutElement;
                this.toolGridBounds = toolCover.gridBounds;
            }
            else if (toolCover.ownedTool == this.ownerTool) {
                this.selfLayout = toolCover.layoutElement;
                this.selfGridBounds = toolCover.gridBounds;
            }
        }
        if (this.toolLayout == null || this.toolLayout == undefined) return;

        this.upgradeListContainer.classList.remove("hidden");
        this.upgradeListContainer.classList.add("highlightableGridElement");
        this.resetUpgradeListSize();
    }
    hideUpgradeList(e) {
        this.upgradeListContainer.classList.add("hidden");
        this.upgradeListContainer.classList.remove("highlightableGridElement");
        e.stopPropagation();
    }
    resetUpgradeListSize() {
        if (this.toolLayout == null || this.toolLayout == undefined) return;

        let toolLayoutRect = this.toolLayout.getBoundingClientRect();
        let toolOuterPadding = parseFloat(window.getComputedStyle(this.toolLayout, null).getPropertyValue('padding-left'));
        let toolInnerPadding = parseFloat(window.getComputedStyle(this.toolLayout.childNodes[0].childNodes[0], null).getPropertyValue('padding-left'));
        let selfLayoutRect = this.ownerTool.inputDiv.getBoundingClientRect();

        let cellBounds = [new Vector2(0, 0), new Vector2(0, 0)];
        cellBounds[0].x = FunLib.minNumber([this.selfGridBounds[0].x, this.selfGridBounds[1].x, this.toolGridBounds[0].x, this.toolGridBounds[1].x]);
        cellBounds[0].y = FunLib.minNumber([this.selfGridBounds[0].y, this.selfGridBounds[1].y, this.toolGridBounds[0].y, this.toolGridBounds[1].y]);
        cellBounds[1].x = FunLib.maxNumber([this.selfGridBounds[0].x, this.selfGridBounds[1].x, this.toolGridBounds[0].x, this.toolGridBounds[1].x]);
        cellBounds[1].y = FunLib.maxNumber([this.selfGridBounds[0].y, this.selfGridBounds[1].y, this.toolGridBounds[0].y, this.toolGridBounds[1].y]);
        
        let cellSize = (selfLayoutRect.width + toolOuterPadding * 2) / Math.abs(this.selfGridBounds[1].x - this.selfGridBounds[0].x);

        this.upgradeListContainer.style["width"] = (cellSize * Math.abs(cellBounds[1].x - cellBounds[0].x) - toolOuterPadding * 2 - toolInnerPadding * 2) + "px";
        this.upgradeListContainer.style["height"] = (cellSize * Math.abs(cellBounds[1].y - cellBounds[0].y) - toolOuterPadding * 2 - toolInnerPadding * 2) + "px";

        if (this.selfGridBounds[0].x <= this.toolGridBounds[0].x) {
            this.upgradeListContainer.style["left"] = 0 + "px";
        }
        else {
            this.upgradeListContainer.style["right"] = 0 + "px";
        }
        if (this.selfGridBounds[0].y <= this.toolGridBounds[0].y) {
            this.upgradeListContainer.style["top"] = 0 + "px";
        }
        else {
            this.upgradeListContainer.style["bottom"] = 0 + "px";
        }
    }

    updatePersonalData(personalData) {
        // GameSave
        this.ownerTool.resetSaveDataProperty("useCycles");
        this.ownerTool.resetSaveDataProperty("resourcesSpent");
    }

    upgradeBecameAvailable(upgradeId) {
        let upgrade = this.upgradeManager.getUpgrade(upgradeId);
        if (upgrade.toolId != this.toolId) return;
        if (this.boundUpgradesList.length > 0 && !this.boundUpgradesList.includes(upgrade.id)) return;

        let element = CustomInputElement.upgradeSlot(
            upgrade,
            function () { this.upgradeManager.requestUpgradeUnlock(upgradeId, this.ownerTool.inputDiv); }. bind(this));

        this.upgradeList.append(element);

        this.updateTextContent();
    }

    upgradeBecameActive(upgradeId) {
        let upgrade = this.upgradeManager.getUpgrade(upgradeId);
        if (upgrade.toolId != this.toolId) return;
        if (this.boundUpgradesList.length > 0 && !this.boundUpgradesList.includes(upgradeId)) return;
        //if (this.upgradeList == null || this.upgradeList == undefined) return;

        let element = CustomInputElement.findChildByGameplayId(this.upgradeList, upgradeId);
        if (element != null && element != undefined) {
            this.upgradeList.removeChild(element);
        }

        this.updateTextContent();

        // GameSave
        this.ownerTool.applySaveDataPropertyChange("useCycles", 1);
        for (let cost of upgrade.cost) {
            this.ownerTool.applySaveDataPropertyChange("resourcesSpent", cost);
        }
    }

    updateTextContent() {
        if (this.upgradeList.childNodes.length > 0) {
            this.availableUpgradesText.textContent = this.upgradeList.childNodes.length;
            this.availableUpgradesPostfixText.innerHTML = "available";
            this.availableUpgradesText.parentNode.classList.remove("hidden");
            this.toolHintText.parentNode.classList.remove("hidden");
        }
        else {
            this.toolHintText.parentNode.classList.add("hidden");
            this.availableUpgradesText.parentNode.classList.add("hidden");
            this.availableUpgradesPostfixText.innerHTML = '<mark class="colorInverse">' + GameData.getFancyToolName(this.toolId) + '</mark><br>Sold Out!';
        }
    }
}