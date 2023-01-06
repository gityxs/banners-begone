class GameSave {
    constructor(gameVersion) {
        this.storage = null;
        if (navigator.cookieEnabled === true) {
            this.storage = window.localStorage;
        }

        this.root = new SaveData_Root(gameVersion);

        this.isStorageAvailable         = this.isStorageAvailable.bind(this);
        this.saveToStorage              = this.saveToStorage.bind(this);
        this.loadFromStorage            = this.loadFromStorage.bind(this);
        this.deepCopyObject             = this.deepCopyObject.bind(this);
        this.clearStorage               = this.clearStorage.bind(this);
        this.writeProperty              = this.writeProperty.bind(this);
        this.readProperty               = this.readProperty.bind(this);

        this.saveToDisk = this.saveToDisk.bind(this);
        this.loadFromDisk = this.loadFromDisk.bind(this);
    }

    isStorageAvailable() {
        return this.storage != null;
        // try {
        //     this.storage.setItem("test", "test");
        //     this.storage.removeItem("test");
        //     return true;
        // } catch (e) {
        //     console.log(e);
        //     return false;
        // }
    }

    saveToStorage() {
        if (this.isStorageAvailable()) {
            let versionMismatchBackup = JSON.parse(this.storage.getItem('bannersBegone_bannersBegone_saveFile_versionMismatch'));
            let GDPR_agreement = this.storage.getItem("GDPR_agreement");
            let accessibility_state = this.storage.getItem("accessibility_state");
            this.clearStorage();

            this.storage.setItem("bannersBegone_saveFile", JSON.stringify(this.root));
            this.storage.setItem("bannersBegone_bannersBegone_saveFile_versionMismatch", JSON.stringify(versionMismatchBackup));

            if (GDPR_agreement != undefined && GDPR_agreement != null) {
                this.storage.setItem("GDPR_agreement", new Boolean(GDPR_agreement === "true").toString());
            }
            if (accessibility_state != undefined && accessibility_state != null) {
                this.storage.setItem("accessibility_state", new Boolean(accessibility_state === "true").toString());
            }

            return true;
        }
        else {
            window.name = JSON.stringify(this.root);

            return false;
        }
    }
    loadFromStorage() {
        //if (!this.isStorageAvailable()) return false;

        if (window.name != "") {
            this.processLoadedSave(window.name);
            window.name = "";
            
            return false;
        }
        else if (this.isStorageAvailable()) {
            this.processLoadedSave(this.storage.getItem('bannersBegone_saveFile'));

            return true; 
        }
    }

    saveToDisk() {
        let saveString = window.btoa(JSON.stringify(this.root));
        let blob = new Blob([saveString], { type: "application/save" }); //new Blob([json], { type: "application/json" });
        let url = URL.createObjectURL(blob);

        let downloadLink = document.createElement('a');
        downloadLink.download = "BannersBegone_Save.save";
        downloadLink.href = url;
        downloadLink.textContent = "exportSaveHelperLink";
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
    }
    loadFromDisk(e) {
        let bannersBegone_saveFile = e.target.files[0];
        if (!bannersBegone_saveFile) {
            return;
        }
        let reader = new FileReader();
        reader.onload = function (e) {

            this.processLoadedSave(window.atob(e.target.result));
            location.reload();

        }.bind(this);
        reader.readAsText(bannersBegone_saveFile);
    }
    processLoadedSave(contents) {
        if (contents != null && contents != undefined) {
            let parsedSave = JSON.parse(contents);

            if (parsedSave.gameVersion === this.root.gameVersion
                || GameManager.backwardsCompatabilityList.includes(parsedSave.gameVersion)) {

                if (GameManager.backwardsCompatabilityList.includes(parsedSave.gameVersion)) {
                    console.warn("GAME VERSION MISMATCH BACKWARD COMPATIBLE");
                    parsedSave.gameVersion = this.root.gameVersion;
                }
                if (this.isStorageAvailable()) {
                    this.storage.setItem("bannersBegone_saveFile", JSON.stringify(parsedSave));
                }
                else {
                    window.name = JSON.stringify(parsedSave);
                }
                this.deepCopyObject(this.root, parsedSave);
            }
            else {
                console.warn("GAME VERSION MISMATCH WHEN LOADING THE SAVE FILE");
                if (this.isStorageAvailable()) {
                    this.storage.setItem("bannersBegone_bannersBegone_saveFile_versionMismatch", contents);
                }

                let reparsedSave = this.reparseVersionMismatch(parsedSave, this.root.gameVersion);
                if (reparsedSave != null) {
                    if (this.isStorageAvailable()) {
                        this.storage.setItem("bannersBegone_saveFile", JSON.stringify(reparsedSave));
                    }
                    else {
                        window.name = JSON.stringify(reparsedSave);
                    }

                    this.deepCopyObject(this.root, reparsedSave);

                    console.warn("GAME VERSION MISMATCH REPARSING SUCCEEDED");
                    alert("GAME VERSION MISMATCH WHEN LOADING THE SAVE FILE\nConversion successful!");
                }
                else {
                    console.warn("GAME VERSION MISMATCH REPARSING FAILED");
                    alert("GAME VERSION MISMATCH WHEN LOADING THE SAVE FILE\nConversion failed.\nReverting...");
                }
            }
        }
        else {
            console.log("No file was provided");
        }
    }
    reparseVersionMismatch(mismatchedParsedSave, currentGameVersion) {
        let reparsedSave = {};
        this.deepCopyObject(reparsedSave, mismatchedParsedSave);

        if (reparsedSave.bossDefeatedTimes == undefined || reparsedSave.bossDefeatedTimes == null) {
            if (reparsedSave.achievedRank != undefined && reparsedSave.achievedRank != null && reparsedSave.achievedRank.gameBeaten === true) {
                reparsedSave.bossDefeatedTimes = 1;
            }
            else if (reparsedSave.resetTimes >= 1) {
                reparsedSave.bossDefeatedTimes = 1;
            }
            else {
                reparsedSave.bossDefeatedTimes = 0;
            }
        }

        reparsedSave.gameVersion = currentGameVersion;

        return reparsedSave;
    }

    deepCopyObject(destination, origin) {
        for (var property in origin) {
            if (origin.hasOwnProperty(property)) {
                if (destination[property] instanceof Object) {
                    this.deepCopyObject(destination[property], origin[property])
                } else {
                    destination[property] = origin[property];
                }
            }
        }
    }

    writeProperty(name, value, triggerSave) {
        if (name === "GDPR_agreement") {
            if (this.isStorageAvailable() === true) {
                this.storage.setItem("GDPR_agreement", new Boolean(value).toString());
            }

            GameManager.analyticsManager.changeGDPRAgreement(value);
            GameManager.setButtonBoolState(GameManager.reviewAnalyticsButton, value);
        }
        else if (name === "accessibility_state") {
            if (this.isStorageAvailable() === true) {
                this.storage.setItem("accessibility_state", new Boolean(value).toString());
            }
            GameManager.setButtonBoolState(GameManager.accessibilityButton, value);
        }
        else {
            this.root[name] = value;
            if (triggerSave === true) {
                this.saveToStorage();
            }
        }
    }
    readProperty(name) {
        let customProp = null;

        if (name === "GDPR_agreement") {
            if (this.isStorageAvailable() === true) {
                customProp = this.storage.getItem("GDPR_agreement");
            }
        }
        else if (name === "accessibility_state") {
            if (this.isStorageAvailable() === true) {
                customProp = this.storage.getItem("accessibility_state");
            }
        }
        else {
            return this.root[name];
        }    
        
        if (customProp == null || customProp == undefined) {
            return undefined;
        }
        else {
            return customProp === "true";
        }
    }

    clearStorage() {
        if (!this.isStorageAvailable()) return;

        this.storage.clear();
    }
    resetSave(rankToSave) {
        let resetTimes = this.root.resetTimes + 1;
        let bossDefeatedTimes = this.root.bossDefeatedTimes;

        this.root.resetSave(rankToSave);
        this.root.resetTimes = resetTimes;
        this.root.bossDefeatedTimes = bossDefeatedTimes;

        GameManager.analyticsManager.setResetDimension(this.root.resetTimes);

        if (this.isStorageAvailable()) {
            this.storage.removeItem("GDPR_agreement");
            this.storage.removeItem("accessibility_state");
        }
    }
    resetSave_safe() {
        this.root.resetSave_safe();
    }
    fullReset() {
        this.root.resetSave(null);

        if (this.isStorageAvailable()) {
            this.clearStorage();
        }

        //this.root.resetSave(null);
        //this.storage.setItem("bannersBegone_saveFile", null);
        //this.storage.setItem("bannersBegone_bannersBegone_saveFile_versionMismatch", null);
    }
}

class SaveData_Root {
    constructor(gameVersion) {
        this.resetSave = this.resetSave.bind(this);
        this.resetSave(null);

        this.gameVersion = gameVersion; // string
    }

    resetSave() {
        this.introComplete = false; // bool
        this.playtime = 0; // int
        this.totalAdPushes = 0; // int
        this.resources_current = {}; // Object
        this.resources_total = {}; // Object
        this.activeUpgrades = []; // string[]
        this.availableUpgrades = []; // string[]
        this.toolsData = {}; // Object
        this.adsData = {}; // Object
        this.bossData = null; // SaveData_Boss
        this.achievedRank = null; // SaveData_Rank
        this.achievedEndlessRank = null; // SaveData_Rank
        this.bossDefeatedTimes = 0; // int

        this.isEndlessMode = false; // bool

        this.resetTimes = 0; // int
    }

    resetSave_safe() {
        this.playtime = 0;
        this.totalAdPushes = 0;
        //this.activeUpgrades = [];
        //this.availableUpgrades = [];
        this.resources_current = {};
        this.resources_total = {};

        for (let toolId in this.toolsData) {
            let tool = this.toolsData[toolId];
            if (!(tool instanceof SaveData_Tool)) continue;

            if (tool.name === GameData.getFancyToolName(11)) {
                tool.isRemoved = true;
            }
            else {
                tool.isRemoved = false;
            }

            tool.personalData = {};
            tool.useCycles = 0;
            tool.failedCycles = 0;
            tool.resourcesGained = {};
            tool.resourcesSpent = {};
        }
    }
}
class SaveData_Ad {
    constructor(id, isBlocked, gridBounds, encryption, imgSrc, cachedPurgeCostOffset, adDifficulty, growDirection) {
        this.id = id; // int
        this.isBlocked = isBlocked; // bool
        this.gridBounds = gridBounds; // Vector2[2]
        this.encryption = encryption; // float
        this.imgSrc = imgSrc; // string
        this.cachedPurgeCostOffset = cachedPurgeCostOffset;
        this.adDifficulty = adDifficulty;
        this.growDirection = growDirection;
        this.isBossPart = false;
    }
}
class SaveData_Boss {
    constructor(id, isBlocked, gridBounds, encryption, imgSrc, cachedPurgeCostOffset, adDifficulty, growDirection) {
        this.adData = new SaveData_Ad(id, isBlocked, gridBounds, encryption, imgSrc, cachedPurgeCostOffset, adDifficulty, growDirection); // SaveData_Ad
        this.rootData = {}; // <int, SaveData_Ad>
        this.childrenData = {}; // <int, SaveData_Ad>

        this.isEndless = false; // bool
        this.totalAdsSpawned = 0; // int
        this.endlessScore = 0; // int
    }
}
class SaveData_Tool {
    constructor(id, isRemoved, gridBounds, name) {
        this.id = id; // int
        this.isRemoved = isRemoved; // bool
        this.gridBounds = gridBounds; // Vector2[2]
        this.name = name; // string
        this.useCycles = 0; // number
        this.failedCycles = 0; // number
        this.resourcesGained = {}; // Object
        this.resourcesSpent = {}; // Object
        this.personalData = {} // Object
    }
}
class SaveData_Rank {
    constructor(gameBeaten, playtime, totalAdPushes, resources, scores, rank) {
        this.gameBeaten = gameBeaten;
        this.playtime = playtime; // int
        this.totalAdPushes = totalAdPushes; // int
        this.resources = resources; // IdValue[]

        this.scores = scores; // num[]
        this.rank = rank; // string
    }
}
class SaveData_EndlessRank {
    constructor(gameBeaten, endlessScore, resources, scores, rank) {
        this.gameBeaten = gameBeaten;
        this.endlessScore = endlessScore; // int
        this.resources = resources; // IdValue[]

        this.scores = scores; // num[]
        this.rank = rank; // string
    }
}
