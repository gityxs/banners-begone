class CustomInputElement {

    constructor() {
    }

    static chargeMinigame() {
        let textHint = CustomInputElement.textHint("Spin the <b>Ad-Blocker</b> fan!");

        let element = document.createElement("div");
        element.classList.add("inputElement_chargeMinigameComponent");
        element.insertAdjacentHTML('beforeend', '\
            <div class="tool_statList">\
                <div class="tool_stat">\
                    <p>Speed:</p>\
                    <p class="chargeMinigameComponent_currentCharge">0 <mark class="colorInverse">RPM</mark></p>\
                </div>\
                <div class="tool_stat">\
                    <p>Record:</p>\
                    <p class="chargeMinigameComponent_currentRecord">0 <mark class="colorInverse">RPM</mark></p>\
                </div>\
            </div>'
            + textHint.outerHTML +
            '<div class="chargeMinigameComponent_spinCounter">\
            </div>\
            ');

        return element;
    }
    static setChargePlayerSpins(spinCounter, spins, maxSpins) {
        while (spinCounter.children.length < maxSpins) {
            let spinPoint = document.createElement("div");
            spinPoint.classList.add("chargeMinigameComponent_spinPoint");
            spinCounter.append(spinPoint);
        }

        while (spinCounter.children.length > maxSpins) {
            spinCounter.removeChild(spinCounter.lastElementChild);
        }

        for (let index = 0; index < spinCounter.children.length; index++) {
            let spinPoint = spinCounter.children[index];
            spinPoint.classList.remove("invisible");
            
            if (index + 1 <= spins) {
                spinPoint.classList.remove("invisible");
            }
            else {
                spinPoint.classList.remove("highlight");
                spinPoint.classList.add("invisible");
            }
        }
    }
    static highlightChargePlayerSpins(spinCounter) {
        for (let index = 0; index < spinCounter.children.length; index++) {
            let spinPoint = spinCounter.children[index];
            spinPoint.classList.add("highlight");
        }
    }

    static textHint(hintText) {
        let element = document.createElement("div");
        element.classList.add("inputElement_textHint");
        element.insertAdjacentHTML('beforeend', '\
            <p>' + hintText + '</p>\
            ');

            return element;
    }

    static resourceGesture(resourceArray) {
        let element = document.createElement("div");
        element.classList.add("inputElement_resourceGestureComponent");

        let stringHTML = '<div class="inputStats">';
        for (let resource of resourceArray) {
            stringHTML += '<p>' + resource.id + ": " + resource.value + '</p>';
        }
        stringHTML += '</div>';

        element.insertAdjacentHTML('beforeend', stringHTML);
            
        return element;
    }

    static powerBounds(powerBounds, maxPower) {
        let beforeWidth = powerBounds[0] / maxPower * 100;
        let middleWidth = powerBounds[1] / maxPower * 100 - beforeWidth;
        let afterWidth = 100 - (beforeWidth + middleWidth);

        let element = document.createElement("div");
        element.classList.add("inputElement_powerBoundsComponent");
        element.insertAdjacentHTML('beforeend', '\
            <div class="tool_statList">\
                <div class="tool_stat">\
                    <p>Current gain:</p>\
                    <p class="powerBoundsComponent_currentGain">0 ' + SymbolDatabase.getSymbol("money") + '</p>\
                </div>\
                <div class="tool_stat">\
                    <p>Max gain:</p>\
                    <p class="powerBoundsComponent_maxGain">0 ' + SymbolDatabase.getSymbol("money") + '</p>\
                </div>\
            </div>\
            <div>\
                <p class="tool_hint"><b>Click</b> to freelance</p>\
            </div>\
            <div>\
                <p id="powerBoundsComponent_powerDisplay">0%</p>\
                <input type="range" class="inputBar" id="powerBoundsComponent_powerBar" disabled>\
                <div class="areaBoundsContainer">\
                    <div class="areaBoundsBottom" style="width: ' + beforeWidth + '%"></div>\
                    <div class="areaBoundsBottom areaBoundsMax" style="width: ' + middleWidth + '%"></div>\
                    <div class="areaBoundsBottom" style="width: ' + afterWidth + '%"></div>\
                </div>\
            </div>');

        return element;
    }

    static setPowerBounds(inputElement, powerBounds, maxPower) {
        let beforeWidth = powerBounds[0] / maxPower * 100;
        let middleWidth = powerBounds[1] / maxPower * 100 - beforeWidth;
        let afterWidth = 100 - (beforeWidth + middleWidth);

        let areaBoundsContainer = inputElement.querySelector(".areaBoundsContainer");
        areaBoundsContainer.innerHTML = "";
        areaBoundsContainer.insertAdjacentHTML('beforeend', '\
            <div class="areaBoundsBottom" style="width: ' + beforeWidth + '%"></div>\
            <div class="areaBoundsBottom areaBoundsMax" style="width: ' + middleWidth + '%"></div>\
            <div class="areaBoundsBottom" style="width: ' + afterWidth + '%"></div>\
        ');
    }

    static powerCharge() {
        let element = document.createElement("div");
        element.classList.add("inputElement_powerChargeComponent");
        element.insertAdjacentHTML('beforeend', '\
            <div>\
                <input type="range" class="inputBar" id="powerChargeComponent_powerBar" disabled>\
            </div>');

        return element;
    }

    static correctStreak() {
        let element = document.createElement("div");
        element.classList.add("inputElement_correctStreakComponent");
        element.insertAdjacentHTML('beforeend', '\
            <div class="tool_statList">\
                <div class="tool_stat">\
                    <p>Power:</p>\
                    <p class="correctStreakComponent_clickStrengthDisplay">0 ' + SymbolDatabase.getSymbol("encryption") + '</p>\
                </div>\
                <div class="tool_stat">\
                    <p>Record:</p>\
                    <p class="correctStreakComponent_clickStrengthRecord">0 ' + SymbolDatabase.getSymbol("encryption") + '</p>\
                </div>\
            </div>\
            <input type="range" class="inputBar correctStreakComponent_progressSlider" disabled>\
            <div class="correctStreakComponent_displayContainer">\
                \
            </div>\
            ');

        return element;
    }

    static insertCorrectStreakDisplay(displayContainer, side, fraction) {
        let sidePadding = 20 * fraction;
        let width = 80 - sidePadding;

        let element = document.createElement("div");
        element.classList.add("correctStreakComponent_display");
        element.style["height"] = (fraction * 90 + 10) + "%";
        element.style["width"] = width + "%";
        
        if (side <= 0) {
            element.classList.add("correctStreakComponent_display_left");
            element.innerHTML = "<p><b>Left</b><br>Mouse Button</p>";
        }
        else {
            element.classList.add("correctStreakComponent_display_right");
            element.innerHTML = "<p><b>Right</b><br>Mouse Button</p>";
        }

        displayContainer.append(element);
        return element;
    }

    static upgrade(toolName, closeCallback) {
        let closeButton = document.createElement("button");
        closeButton.classList.add("upgradeComponent_closeButton", "tool_hint");
        closeButton.innerHTML = '<b>Close</b>';
        closeButton.addEventListener("click", closeCallback);

        let upgradeList = document.createElement("div");
        upgradeList.classList.add("upgradeComponent_upgradeList");
        
        let upgradeListContainer = document.createElement("div");
        upgradeListContainer.classList.add("upgradeComponent_upgradeListContainer");
        upgradeListContainer.classList.add("hidden");

        upgradeListContainer.append(upgradeList, closeButton);
    


        let element = document.createElement("div");
        element.classList.add("inputElement_upgradeComponent");

        element.insertAdjacentHTML('beforeend', '\
            <div class="upgradeComponent_infoText">\
                <div>\
                    <p class="upgradeComponent_toolHint"><b>Click</b> to see<br><mark class="colorInverse">' + toolName + '</mark> Upgrades</p>\
                </div>\
                <div>\
                    <p><mark class="upgradeComponent_availableUpgrades colorInverse"><b>-1</b></mark></p>\
                    <p class="upgradeComponent_availableUpgradesPostfix">available</p>\
                </div>\
            </div>\
            ');
        element.appendChild(upgradeListContainer);

        return element;
    }
    static upgradeSlot(upgrade, callback) {
        let upgradeText = document.createElement("div");
        upgradeText.classList.add("upgradeComponent_upgradeText");
        upgradeText.insertAdjacentHTML('beforeend', '\
            <h3>' + upgrade.name + '</h3>\
            <p>' + upgrade.description + '</p>\
            ');

        let upgradeCost = document.createElement("div");
        upgradeCost.classList.add("upgradeComponent_upgradeCost");
        for (let resourceCost of upgrade.cost) {
            let resourceCostElement = document.createElement("div");
            resourceCostElement.classList.add("upgradeComponent_upgradeResourceCost");

            let costText = "";
            if (resourceCost.value === 0) {
                costText = "FREE";
            }
            else {
                costText = ResourceManager.formatResource(resourceCost.value, 3) + ' ' + SymbolDatabase.getSymbol(resourceCost.id);
            }

            resourceCostElement.insertAdjacentHTML('beforeend', '\
                <p>' + costText + '</p>\
                ');

            upgradeCost.append(resourceCostElement);
        }

        let element = document.createElement("button");
        element.classList.add("upgradeComponent_upgradeSlot");
        element.setAttribute("gameplay_id", upgrade.id);
        element.addEventListener("click", callback);
        element.append(upgradeText, upgradeCost);

        return element;
    }

    static findChildByGameplayId(parentNode, gameplayId) {
        let selectorString = "[gameplay_id=\"" + gameplayId + "\"]";
        let element = parentNode.querySelector(selectorString);
        return element;
    }

    static adSellout(callback) {
        let buyButton = document.createElement("button");
        buyButton.classList.add("adSelloutComponent_buyButton");
        buyButton.textContent = "Host an Ad";
        buyButton.addEventListener("click", callback);

        let stats = document.createElement("div");
        stats.classList.add("adSelloutComponent_stats");
        stats.insertAdjacentHTML('beforeend', '\
                <div>\
                    <p class="adSelloutComponent_statCost">Cost per ad: ' + -1 + ' ' + SymbolDatabase.getSymbol("money") + '</p>\
                </div>\
                <div>\
                    <p class="adSelloutComponent_statSpeed">Regen speed: ' + -1 + '/sec</p>\
                    <p class="adSelloutComponent_statResistance">Click effectiveness: ' + -1 + '</p>\
                    <p class="adSelloutComponent_statRevenue">Revenue: ' + -1 + ' ' + SymbolDatabase.getSymbol("money") + '/sec</p>\
                </div>\
            ');

        let element = document.createElement("div");
        element.classList.add("inputElement_adSelloutComponent");
        element.append(buyButton, stats);

        return element;
    }

    static investementSelection(callback) {
        let buyButton = document.createElement("button");
        buyButton.classList.add("investementComponent_buyButton");
        buyButton.textContent = "Participate";
        buyButton.addEventListener("click", callback);

        let cooldownBar = document.createElement("input");
        cooldownBar.type = "range"
        cooldownBar.classList.add("inputBar", "investementComponent_chargeTimerBar");
        cooldownBar.disabled = true;

        let cooldownText = document.createElement("p");
        cooldownText.classList.add("investementComponent_cooldownText");
        cooldownText.textContent = "Next Hackathon in:";

        let cooldownDiv = document.createElement("div");
        cooldownDiv.classList.add("hidden", "investementComponent_cooldownDiv");
        cooldownDiv.append(cooldownText, cooldownBar);

        let stats = document.createElement("div");
        stats.classList.add("investementComponent_stats");
        stats.insertAdjacentHTML('beforeend', '\
                <div>\
                    <p class="investementComponent_statDuration">Hackathon duration: ' + -1 + ' sec</p>\
                    <p class="investementComponent_statControlPoints">Competition stages: ' + -1 + '</p>\
                    <p class="investementComponent_statControlPointCost">Effort per stage: ' + -1 + ' ' + SymbolDatabase.getSymbol("encryption") + '</p>\
                </div>\
                <div>\
                    <p class="investementComponent_statMaxProfit">Max prize: ' + -1 + ' ' + SymbolDatabase.getSymbol("money") + '</p>\
                </div>\
            ');

        let element = document.createElement("div");
        element.classList.add("inputElement_investementComponent");
        element.append(stats, buyButton, cooldownDiv);

        return element;
    }

    static investementCampaign(controlPointAmount, controlPointLayout) {
        let elementInnerHTML = '\
            <div class="investementComponent_campaignProgressContainer">\
                <p>Hackathon duration:</p>\
                <input type="range" class="inputBar investementComponent_campaignProgress" disabled>\
                <div class="areaBoundsContainer">';

        let lastPointFraction = 0;
        for (let i = 0; i < controlPointAmount; i++) {
            elementInnerHTML += '       <div class="areaBoundsBottom" style="width: ' + (controlPointLayout[i] - lastPointFraction) * 100 + '%"></div>';
            lastPointFraction = controlPointLayout[i];
            //elementInnerHTML += '       <div class="areaBoundsBottom" style="width: ' + controlPointWidth + '%"></div>';
        }
        elementInnerHTML += '       <div class="areaBoundsBottom" style="width: ' + (1 - lastPointFraction) * 100 + '%"></div>';

        elementInnerHTML += '\
                </div>\
            </div>\
            <div class="investementComponent_investEfficiencyContainer">\
                <p class="investementComponent_investEfficiencyDisplay">Current prize: 0' + SymbolDatabase.getSymbol("money") + '</p>\
                <input type="range" class="inputBar investementComponent_investEfficiency" disabled>\
            </div>\
            <div class="tool_hintDisplay">\
                <p class="tool_hint"><b>Click!</b></p>\
            </div>\
            ';

        let element = document.createElement("div");
        element.classList.add("inputElement_investementComponent");
        element.insertAdjacentHTML('beforeend', elementInnerHTML);

        return element;
    }

    static passiveIncome(callback) {
        let buyButton = document.createElement("button");
        buyButton.classList.add("passiveIncomeComponent_buyButton");
        buyButton.textContent = "Install AI Core";
        buyButton.addEventListener("click", callback);

        let stats = document.createElement("div");
        stats.classList.add("passiveIncomeComponent_stats");
        stats.insertAdjacentHTML('beforeend', '\
                <div>\
                    <p class="passiveIncomeComponent_statActiveAmount">Active cores: ' + -1 + '</p>\
                    <p class="passiveIncomeComponent_statCost">Cost per core: ' + -1 + ' ' + SymbolDatabase.getSymbol("money") + '</p>\
                    <p class="passiveIncomeComponent_statRevenue">Gain per spawn: ' + -1 + ' ' + SymbolDatabase.getSymbol("adStrike") + '/sec</p>\
                </div>\
                <div>\
                    <p class="passiveIncomeComponent_statTotalRevenue">Next spawn in:</p>\
                    <input type="range" class="inputBar" disabled><p class="passiveIncomeComponent_timerUnavailable hidden"><mark class="colorInverse">Suspended:</mark> all space is occupied</p>\
                </div>\
            ');

        let element = document.createElement("div");
        element.classList.add("inputElement_passiveIncomeComponent");
        element.append(buyButton, stats);

        return element;
    }

    static resourceExchange(exchangeResources, exchangeCallback, selectorChoiceCallback) {
        let buySelector = CustomInputElement.exchangeResourceSelector(exchangeResources, "sell", selectorChoiceCallback);
        let sellSelector = CustomInputElement.exchangeResourceSelector(exchangeResources, "buy", selectorChoiceCallback);

        let actionSelectors = document.createElement("div");
        actionSelectors.classList.add("resourceExchangeComponent_actionSelectors");
        actionSelectors.append(buySelector, sellSelector);

        let selectionHint = document.createElement("div");
        selectionHint.classList.add("resourceExchangeComponent_selectionHint");
        selectionHint.insertAdjacentHTML('beforeend', '<p><b>Select</b> different<br>resource types</p>');

        let resourceSliders = document.createElement("div");
        resourceSliders.classList.add("resourceExchangeComponent_resourceSliders");
        resourceSliders.classList.add("hidden");

        let exchangeButton = document.createElement("button");
        exchangeButton.classList.add("resourceExchangeComponent_exchangeButton");
        exchangeButton.classList.add("hidden");
        exchangeButton.textContent = "Exchange";
        exchangeButton.addEventListener("click", exchangeCallback);

        let element = document.createElement("div");
        element.classList.add("inputElement_resourceExchangeComponent");
        element.append(actionSelectors);

        element.append(selectionHint, resourceSliders, exchangeButton);

        return element;
    }

    static exchangeResourceSelector(exchangeResources, type, selectorChoiceCallback) {
        let element = document.createElement("div");
        element.classList.add("exchangeResourceSelector");
        element.setAttribute("selectortype", type);



        let selectorDisplay = document.createElement("div");
        selectorDisplay.classList.add("exchangeResourceSelector_selectorDisplay");

        let selectorDisplayText = document.createElement("p");
        selectorDisplayText.classList.add("exchangeResourceSelector_selectorDisplayText");
        switch (type) {
            case "buy":
                selectorDisplayText.textContent = "Type:";
                break;
            case "sell":
                selectorDisplayText.textContent = "Type:";
                break;
        }
        
        let selectorDisplayChoice = document.createElement("p");
        selectorDisplayChoice.classList.add("exchangeResourceSelector_selectorDisplayChoice");
        let resourceId = exchangeResources.keys().next().value;
        selectorDisplayChoice.innerHTML = SymbolDatabase.getSymbol(resourceId);

        selectorDisplay.append(selectorDisplayText, selectorDisplayChoice);



        let selectorList = document.createElement("div");
        selectorList.classList.add("exchangeResourceSelector_selectorList");
        selectorList.classList.add("highlightableGridElement");
        selectorList.classList.add("hidden");
        selectorList.append(selectorDisplay.cloneNode(true));
        for (let resourceId of exchangeResources.keys()) {
            let resourceButton = document.createElement("button");
            resourceButton.classList.add("exchangeResourceSelector_resourceButton");
            resourceButton.setAttribute("resourceid", resourceId);
            resourceButton.insertAdjacentHTML('beforeend', SymbolDatabase.getSymbol(resourceId));
            resourceButton.addEventListener("click", function(e) { selectorChoiceCallback(e, type, resourceId); });
            
            selectorList.append(resourceButton);
        }



        element.append(selectorDisplay, selectorList);
        element.addEventListener("mouseover", function (e) { selectorList.classList.remove("hidden"); });
        element.addEventListener("mouseleave", function (e) { selectorList.classList.add("hidden"); });
        return element;
    }

    static exchangeResourceSliders(exchangeResources, valueChangedCallback) {
        for (let resourceId of exchangeResources.keys()) {
            let resourceSlider = document.createElement("adclick-resourceslider");
            resourceSlider.addEventListener("onvaluechange", valueChangedCallback);
            resourceSlider.setBounds(-1000, 1000);
            resourceSlider.setIdValue(new IdValue(resourceId, 0));

            exchangeResources.get(resourceId).boundSlider = resourceSlider;
        }
    }

    static surpriseMechanic(startCallback, cancelCallback, resourceList) {
        let progress = document.createElement("div");
        progress.classList.add("surpriseMechanicComponent_progress");

        let stats = document.createElement("div");
        stats.classList.add("surpriseMechanicComponent_stats");
        for (let resource of resourceList) {
            let resourceElement = document.createElement("div");
            resourceElement.classList.add("surpriseMechanicComponent_rewardContainer");
            resourceElement.insertAdjacentHTML('beforeend', '\
                <p>' + SymbolDatabase.getSymbol(resource.id) + ' </p>\
                <p>' + ResourceManager.formatResource(resource.value, 3) + '</p>\
                ');

            stats.append(resourceElement);
        }

        let textHint = CustomInputElement.textHint("<b>Hold</b><br>to receive:");
        textHint.style["position"] = "inherit";
        textHint.style["display"] = "block";

        let element = document.createElement("div");
        element.classList.add("inputElement_surpriseMechanicComponent");
        element.append(progress, textHint, stats);

        element.addEventListener("mousedown", startCallback);
        element.addEventListener("mouseup", cancelCallback);
        element.addEventListener("mouseleave", cancelCallback);

        return element;
    }

    static mainTool() {
        let element = document.createElement("div");
        element.classList.add("inputElement_mainToolComponent");
        element.insertAdjacentHTML('beforeend', '\
            <p>\
                <b>Click Here</b><br>to Push Ads!\
            </p>\
            ');

        return element;
    }

    static lockedTool(isUpgrade, toolName) {
        let element = document.createElement("div");
        element.classList.add("inputElement_lockedToolComponent");

        if (!isUpgrade) {
            element.insertAdjacentHTML('beforeend', '\
                <p><em>Block the <b>AD</b>!</em><br><br>\
                To unlock <b>FULL</b> potential!</p>\
                ');
        }
        else {
            element.insertAdjacentHTML('beforeend', '\
                <p><em>Block the <b>AD</b>!</em><br><br>\
                To buy <mark class="colorInverse">' + toolName + '</mark><br>upgrades!</p>\
            ');
        }

        return element;
    }
}