class TickBasedPopupCache {

    constructor(idValue, bounds, delayTime, isForced, callback) {
        this.idValue = new IdValue(idValue.id, 0.0);
        this.sign = FunLib.sign(idValue.value);
        this.bounds = bounds;
        this.delayTime = delayTime;
        this.isForced = isForced;
        this.callback = callback;

        this.areRequirementsMet     = this.areRequirementsMet.bind(this);
        this.accumulateValue        = this.accumulateValue.bind(this);
        this.timerEnded             = this.timerEnded.bind(this);

        TimerManager.setTimer(delayTime, this.timerEnded);
    }

    areRequirementsMet(idValue, bounds) {
        return (this.idValue.id == idValue.id 
            && this.sign == FunLib.sign(idValue.value) 
            && this.bounds == bounds);
    }

    accumulateValue(value) {
        this.idValue.value += value;
    }

    timerEnded() {
        this.callback(this);
    }
}

class LevelResourceReq {

    constructor(resource, base, growthRate) {
        this.resource = resource;
        this.base = base;
        this.growthRate = growthRate;
    }


}

class ResourceManager {

    constructor() {
        this.resources = [] // IdValue[]
        this.totalResources = [] // IdValue[]
        this.resourceList = document.getElementById("resourceList");
        this.popupAnimDuration = 1;
        this.popupLowAnimDuration = 1;
        this.popupCache = [];

        this.maxPow = 50;
        this.resourceReqs = [
            new LevelResourceReq("money", 100, 1.2),
            new LevelResourceReq("adStrike", 100, 1.2),
            new LevelResourceReq("encryption", 10, 1.2),
        ];

        this.resourceChangedCallbacks = [];

        this.addNewResource         = this.addNewResource.bind(this);
        this.applyResourceChange    = this.applyResourceChange.bind(this);
        this.updateResourceUI       = this.updateResourceUI.bind(this);
        this.displayResourcePopup   = this.displayResourcePopup.bind(this);
        this.handleDisplayCache     = this.handleDisplayCache.bind(this);
        this.popupCacheEnded        = this.popupCacheEnded.bind(this);
        this.getLevelReq            = this.getLevelReq.bind(this);
        this.displayResourceInsufficient = this.displayResourceInsufficient.bind(this);
        
        this.addNewResource("money");
        this.addNewResource("adStrike");
        this.addNewResource("encryption");
    }

    add_resourceChangedCallback(callback) {
        if (callback == undefined || callback == null) return;
        this.resourceChangedCallbacks.push(callback);

        for (let resource of this.resources) {
            callback(resource);
        }
    }

    remove_resourceChangedCallback(callback) {
        if (callback == undefined || callback == null) return;
        FunLib.removeFromArray(this.resourceChangedCallbacks, callback);
    }

    broadcast_resourceChangedCallback(idValue) {
        for (let callback of this.resourceChangedCallbacks) {
            if (callback == undefined || callback == null) continue;
            callback(idValue);
        }
    }

    addNewResource(id) {
        let resource = new IdValue(id, 0.0);

        let element = document.createElement("div");
        element.classList.add("mainGridElement");
        element.insertAdjacentHTML('beforeend', '\
            <p class="resourceIcon">' + SymbolDatabase.getSymbol(id) + '</p>\
            <p class="resourceValue">default</p>');
            
        element.setAttribute("resource_name", id);
        this.resourceList.append(element);

        this.resources.push(resource);
        this.totalResources.push(new IdValue(resource.id, resource.value));
        this.updateResourceUI(resource);

        return resource;
    }

    applyResourceChange(idValue, sourceElement, isTickBased, isForced, analyticsResource) {
        let resourceObj = this.resources.find(function (element, index, array) {
            return element.id === idValue.id;
        });

        if (resourceObj == undefined) {
            resourceObj = this.addNewResource(idValue.id);
        }

        if (resourceObj.value + idValue.value <= 0) {
            idValue.value = - resourceObj.value;
        }
        resourceObj.value += idValue.value;
        resourceObj.value = FunLib.clamp(resourceObj.value, 0, resourceObj.value);
        /*let rounded = Math.round(resourceObj.value);
        if (Math.abs(rounded - resourceObj.value) < 0.00001) {
            resourceObj.value = rounded;
        }*/

        let totalResourceObj = this.totalResources.find(function (element, index, array) {
            return element.id === idValue.id;
        });
        if (idValue.value > 0) {
            totalResourceObj.value = Math.round(totalResourceObj.value + idValue.value);
        }

        this.updateResourceUI(resourceObj);

        // Handle visual display
        if (sourceElement != null && sourceElement != undefined) {
            if (!isTickBased) {
                this.displayResourcePopup(idValue, sourceElement.parentNode.style["grid-area"], isForced);
            }
            else {
                this.handleDisplayCache(idValue, sourceElement.parentNode.style["grid-area"], isForced);
            }
        }

        this.broadcast_resourceChangedCallback(resourceObj);

        // GameSave
        let resources_current = GameManager.gameSave.readProperty("resources_current");
        let resources_total = GameManager.gameSave.readProperty("resources_total");
        resources_current[resourceObj.id] = resourceObj.value;
        resources_total[totalResourceObj.id] = totalResourceObj.value;
        //GameManager.saveGame();

        if (analyticsResource != null && analyticsResource != undefined) {
            analyticsResource.setIdValue(idValue);
            GameManager.analyticsManager.resourceChange(analyticsResource);
        }
        else {
            analyticsResource = AnalyticsResource.quick("cheat", "consoleCheat");
            analyticsResource.setIdValue(idValue);
            GameManager.analyticsManager.resourceChange(analyticsResource);
        }
    }

    resetAllResources() {
        for (let resource of this.resources) {
            this.applyResourceChange(new IdValue(resource.id, -resource.value), null, false, true, null);
        }
        for (let resource of this.totalResources) {
            resource.value = 0;
        }
    }

    displayResourceInsufficient(resourceId, sourceElement) {
        let bounds = sourceElement.parentNode.style["grid-area"];
        let resourceText = '<mark class="resourceLow">Low</mark> ' + SymbolDatabase.getSymbol(resourceId);

        let popup = document.createElement("div");
        popup.classList.add("resourcePopup", "popupVibrate");
        popup.insertAdjacentHTML('beforeend', '\
                <p>' + resourceText + '</p>\
                ');

        popup.querySelector("p").classList.add("resourceColor_low");
        popup.style["animation-name"] = "popup_vibrate";
        popup.style["animation-duration"] = this.popupLowAnimDuration + "s";

        let wrapper = document.createElement("div");
        wrapper.classList.add("popupResourceWrapper");
        wrapper.style["grid-area"] = bounds;
        wrapper.append(popup);

        TimerManager.setTimer(this.popupLowAnimDuration, function () { ResourceManager.removeResourcePopup(wrapper); });
        document.getElementById("mainGridContainer").appendChild(wrapper);
    }

    updateResourceUI(resourceIdValue) {
        let selectorString = "[resource_name=\"" + resourceIdValue.id + "\"]";
        let element = this.resourceList.querySelector(selectorString);
        let valueElement = element.querySelector(".resourceValue");
        valueElement.innerHTML = ResourceManager.formatResource(Math.floor(resourceIdValue.value), 3);
    }

    getResourceValue(resourceId) {
        let resourceObj = this.resources.find(function (element, index, array) {
            return element.id === resourceId;
        });

        if (resourceObj == undefined) {
            return 0;
        }

        return resourceObj.value;
    }

    displayResourcePopup(idValue, bounds, isForced) {
        let sign = idValue.value >= 0 ? "+" : "-";
        let roundMultiplier = idValue.value >= 100 ? 1 : 100;
        let num = Math.round(Math.abs(idValue.value) * roundMultiplier) / roundMultiplier;
        let resourceText = sign + ResourceManager.formatResource(num, 3) + SymbolDatabase.getSymbol(idValue.id);
        
        if (num == 0) return;

        let usedDuration = this.popupAnimDuration;

        let popup = document.createElement("div");
        popup.classList.add("resourcePopup", "popup_disappear");
        popup.insertAdjacentHTML('beforeend', '\
                <p>' + resourceText + '</p>\
                ');

        let colorStyle = "resourceColor_gained";
        if (idValue.value < 0) {
            if (isForced) {
                colorStyle = "resourceColor_low"
                usedDuration = this.popupLowAnimDuration;
            }
            else {
                colorStyle = "resourceColor_spent";
            }
        }

        popup.querySelector("p").classList.add(colorStyle);
        popup.style["animation-name"] = idValue.value >= 0 ? "popup_disappear_up" : "popup_disappear_down";
        popup.style["animation-duration"] = usedDuration + "s";

        let wrapper = document.createElement("div");
        wrapper.classList.add("popupResourceWrapper");
        wrapper.style["grid-area"] = bounds;
        wrapper.append(popup);

        TimerManager.setTimer(usedDuration, function () { ResourceManager.removeResourcePopup(wrapper); });
        document.getElementById("mainGridContainer").appendChild(wrapper);
    }

    handleDisplayCache(idValue, bounds, isForced) {
        let foundCache = null;
        for (let cache of this.popupCache) {
            if (cache.areRequirementsMet(idValue, bounds)) {
                foundCache = cache;
            }
        }

        if (foundCache == null) {
            foundCache = new TickBasedPopupCache(idValue, bounds, 1.0, isForced, this.popupCacheEnded);
            this.popupCache.push(foundCache);
        }

        foundCache.accumulateValue(idValue.value);
    }

    popupCacheEnded(cache) {
        FunLib.removeFromArray(this.popupCache, cache);
        this.displayResourcePopup(cache.idValue, cache.bounds, cache.isForced);
    }

    static removeResourcePopup(popup) {
        if (popup == null || popup == undefined) return;

        popup.remove();
    }

    getLevelReq(resource, level, prettify) {
        let resourceReq = this.resourceReqs.find(function (element, index, array) {
            return element.resource === resource;
        });
        if (resourceReq == null || resourceReq == undefined) return;

        let pow = FunLib.lerpNumber(level, 0, this.maxPow);
        let result = resourceReq.base * Math.pow(resourceReq.growthRate, pow);

        if (prettify) {
            result = FunLib.prettifyExpNum(result, resourceReq.base, 3);
        }

        return result;
    }

    static formatResource(value, formattingTier) {
        let tier = Math.log10(value) / 3 | 0;
        let suffix = "";
        let treshold = 2;
        if (formattingTier != undefined && formattingTier != null) {
            treshold = formattingTier
        }

        if (tier >= treshold + 1) {
            let tierMult = (tier - 1) * 3;
            suffix = " *10<sup>" + tierMult + "</sup>";

            let scale = Math.pow(10, tierMult);
            value = Math.round(value / scale);
        }

        let parts = value.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

        return parts.join(".") + suffix;
    }

    updateToLoadedData() {
        // GameLoad
        let resources_current = GameManager.gameSave.readProperty("resources_current");
        let resources_total = GameManager.gameSave.readProperty("resources_total");

        for (let idValue of this.resources) {
            let value = resources_current[idValue.id];
            if (value != null && value != undefined) {
                idValue.value = resources_current[idValue.id];

                this.updateResourceUI(idValue);
                this.broadcast_resourceChangedCallback(idValue);
            }
        }
        for (let idValue of this.totalResources) {
            let value = resources_current[idValue.id];
            if (value != null && value != undefined) {
                idValue.value = resources_total[idValue.id];
            }
        }
    }
}