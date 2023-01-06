//
// ProgressTool
//
class ProgressTool {

    constructor(id, inputHandler, worker, progressionRequest, toolComponents, rewards) {
        this.id = id;
        this.inputHandler = inputHandler; // ToolInputHandler
        this.worker = worker; // ToolWorker
        this.progressionRequest = progressionRequest; // function
        this.toolActive = false; // bool
        this.targetBlock = null;
        this.inputDiv = null;

        this.coverId = -1;

        this.rewards = rewards; // IdValue[]
        if (this.rewards == null || this.rewards == undefined) {
            this.rewards = [];
        }

        this.toolComponents = toolComponents; // ToolComponent[]
        if (this.toolComponents == null || this.toolComponents == undefined) {
            this.toolComponents = [];
        }



        this.useCycles = 0; // number
        this.failedCycles = 0; // number
        this.resourcesGained = {}; // IdValue[]
        this.resourcesSpent = {}; // IdValue[]
        this.personalData = {}; // Object



        this.lifecycleCall          = this.lifecycleCall.bind(this);
        this.getComponentsByExecOverride = this.getComponentsByExecOverride.bind(this);

        this.activate               = this.activate.bind(this);
        this.deactivate             = this.deactivate.bind(this);
        this.inputSucceeded         = this.inputSucceeded.bind(this);
        this.tick                   = this.tick.bind(this);

        this.activate_def           = this.activate_def.bind(this);
        this.deactivate_def         = this.deactivate_def.bind(this);
        this.inputSucceeded_def     = this.inputSucceeded_def.bind(this);
        this.tick_def               = this.tick_def.bind(this);

        this.setTargetBlock         = this.setTargetBlock.bind(this);
        this.swapInputHandler       = this.swapInputHandler.bind(this);
        this.addComponent           = this.addComponent.bind(this);
        this.removeComponent        = this.removeComponent.bind(this);
        this.refreshInputHandle     = this.refreshInputHandle.bind(this);
        this.giveRewards            = this.giveRewards.bind(this);
        this.registerForUpgrades    = this.registerForUpgrades.bind(this);

        this.registerForUpgrades();
        this.lifecycleCall(this.toolComponents, LifecycleState.create, "create", null, { ownerTool: this });
    }

    // Lifecycle helper functions
    lifecycleCall(originalComponents, state, componentStateFunction, selfStateFunction, argObj) {
        let components_default = originalComponents.slice(0);

        // We exclude override processing from tick()
        // It makes no sense and eats lots of RAM
        if (state == LifecycleState.tick) {
            // Time to call tool's own state function
            if (selfStateFunction != null) {
                this[selfStateFunction].call(this, argObj);
            }

            for (let component of components_default) {
                if (component.enabled === false) continue;
                component[componentStateFunction].call(component, argObj);
            }
        }
        else {
            let components_before = this.getComponentsByExecOverride(components_default, state, LifecycleExecutionOrder.before, true);
            let components_after = this.getComponentsByExecOverride(components_default, state, LifecycleExecutionOrder.after, true);

            for (let component of components_before) {
                if (component.enabled === false) continue;
                let continueCallChain = component[componentStateFunction].call(component, argObj);

                if (continueCallChain === false) {
                    return;
                }
            }

            // Time to call tool's own state function
            if (selfStateFunction != null) {
                this[selfStateFunction].call(this, argObj);
            }

            for (let component of components_default) {
                if (component.enabled === false) continue;
                let continueCallChain = component[componentStateFunction].call(component, argObj);

                if (continueCallChain === false) {
                    return;
                }
            }
            for (let component of components_after) {
                if (component.enabled === false) continue;
                let continueCallChain = component[componentStateFunction].call(component, argObj);

                if (continueCallChain === false) {
                    return;
                }
            }        
        }
    }

    getComponentsByExecOverride(components, state, order, shiftElements) {
        let priorityComponents = [];
        let foundComponents = [];
        
        // get all fitting components
        for (let index = components.length - 1; index >= 0; index--) {
            let component = components[index];
            if (component.hasOverrides === false) continue;

            let shouldShiftComponent = false;

            for (let override of component.execOrderOverrides) {
                if (override.lifecycleState == state && override.executionOrder == order) {
                    shouldShiftComponent = true;
                    priorityComponents.push(new CompPriority(component, override.priority));
                    break;
                }
            }

            if (shouldShiftComponent && shiftElements) {
                components.splice(index, 1);
            }
        }

        // sort components by priority
        priorityComponents.sort(CompPriority.sort);

        // set actual components
        for (let compPriority of priorityComponents) {
            foundComponents.push(compPriority.component);
        }

        return foundComponents;
    }

    // Lifecycle functions
    activate(inputDiv) {
        this.lifecycleCall(this.toolComponents, LifecycleState.activate, "activate", "activate_def", { inputDiv: inputDiv });
    }

    deactivate() {
        if (!this.toolActive) return;

        this.lifecycleCall(this.toolComponents, LifecycleState.deactivate, "deactivate", "deactivate_def", null);
    }

    tick(deltaTime) {
        if (!this.toolActive) return;

        this.lifecycleCall(this.toolComponents, LifecycleState.tick, "tick", "tick_def", { deltaTime: deltaTime });
    }

    inputSucceeded(inputScore, isTickBased) {
        if (!this.toolActive) return;
        
        this.lifecycleCall(this.toolComponents, LifecycleState.inputSucceeded, "inputSucceeded", "inputSucceeded_def", { inputScore: inputScore, isTickBased: isTickBased });
    }

    // Default lifecycle behavior
    activate_def(argObj) {
        this.toolActive = true;
        this.inputDiv = argObj.inputDiv;
        this.inputHandler.setupInput(this.inputDiv, this.inputSucceeded);
    }

    deactivate_def() {
        this.toolActive = false;
        this.inputHandler.deactivate();
    }

    tick_def(argObj) {
        this.inputHandler.tick(argObj.deltaTime);
    }

    inputSucceeded_def(argObj) {
        if (this.toolActive === false) return;

        let progressDelta = this.worker.getProgress(this.targetBlock, argObj.inputScore);
        //this.progressionRequest(this, progressDelta);
        this.giveRewards(progressDelta, this.rewards, argObj.isTickBased);
    }

    // Other functions
    setTargetBlock(targetBlock) {
        this.targetBlock = targetBlock;
    }

    swapInputHandler(newInputHandler) {
        if (newInputHandler == null || newInputHandler == this.inputHandler) return;

        let oldInputHandler = this.inputHandler;
        this.inputHandler = newInputHandler;
        
        if (this.toolActive === true) {
            oldInputHandler.deactivate();
            this.inputHandler.setupInput(this.inputDiv, this.inputSucceeded);
        }

        return oldInputHandler;
    }

    addComponent(component) {
        if (this.toolComponents.includes(component) === true) return;

        this.toolComponents.push(component);
        if (this.toolActive === true) {
            component["activate"].call(component, { inputDiv: this.inputDiv });
        }
    }

    removeComponent(component) {
        if (this.toolComponents.includes(component) === false) return;
        
        this.toolComponents.splice(this.toolComponents.indexOf(component), 1);
        if (this.toolActive === false) {
            component["deactivate"].call(component, null);
        }
    }

    refreshInputHandle(customCallback) {
        let callback = this.inputSucceeded;
        if (customCallback != null && customCallback != undefined) {
            callback = customCallback;
        }
        
        this.inputHandler.setupInput(this.inputDiv, callback);
    }

    giveRewards(progressDelta, rewardIdValues, isTickBased) {
        for (let reward of rewardIdValues) {
            this.progressionRequest(this, progressDelta, reward, isTickBased);

            // GameSave
            this.applySaveDataPropertyChange("resourcesGained", new IdValue(reward.id, reward.value * progressDelta));
            //console.log("Gave rewards: " + reward.id + " " + reward.value * progressDelta);
        }
    }

    registerForUpgrades() {
        let memberIdValues = [];
        for (let component of this.toolComponents) {
            memberIdValues = memberIdValues.concat(component.getUpgradeMembers());
        }

        UpgradeManager.registerTool(this.id, memberIdValues);
    }

    updateComponentPersonalData(personalData) {
        this.personalData = personalData;

        for (let component of this.toolComponents) {
            component.updatePersonalData(personalData);
        }
    }

    updateSaveData() {
        // GameSave
        let toolData = GameManager.gameSave.readProperty("toolsData")[this.coverId];
        toolData.useCycles = this.useCycles;
        toolData.failedCycles = this.failedCycles;
        toolData.resourcesGained = this.resourcesGained;
        toolData.resourcesSpent = this.resourcesSpent;
        toolData.personalData = this.personalData;

        //GameManager.saveGame();
    }

    applySaveDataPropertyChange(name, value) {
        // GameSave
        let toolData = GameManager.gameSave.readProperty("toolsData")[this.coverId];

        switch(name) {
            case "useCycles":{
                this.useCycles += value;
                GameManager.analyticsManager.toolUsed(true, GameData.getFancyToolName(this.id));
            }
                break;
            
            case "failedCycles": {
                this.failedCycles += value;
                GameManager.analyticsManager.toolUsed(false, GameData.getFancyToolName(this.id));
            }
                break;
            
            case "resourcesGained": {
                let resource = this.resourcesGained[value.id];
                resource = resource == undefined ? 0 : resource;
                this.resourcesGained[value.id] = resource + value.value;
            }
                break;
            
            case "resourcesSpent": {
                let resource = this.resourcesSpent[value.id];
                resource = (resource == undefined || resource == null) ? 0 : resource;
                this.resourcesSpent[value.id] = resource + value.value;
            }
                break;
            
            case "personalData": {
                this.personalData = value;
            }
                break;
        }

        toolData[name] = this[name];
    }

    resetSaveDataProperty(name) {
        // GameSave
        let toolData = GameManager.gameSave.readProperty("toolsData")[this.coverId];

        switch (name) {
            case "useCycles": {
                this.useCycles = 0;
                break;
            }
            case "failedCycles": {
                this.failedCycles = 0;;
                break;
            }
            case "resourcesGained": {
                this.resourcesGained = {};
                break;
            }
            case "resourcesSpent": {
                this.resourcesSpent = {};
                break;
            }
            case "personalData": {
                this.personalData = {}
                break;
            }
        }

        toolData[name] = this[name];
    }
}