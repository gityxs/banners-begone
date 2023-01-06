class ToolUpgrade {

    constructor(toolId, id, name, description, memberDeltas, cost, resourceRequirements, upgradeRequirements) {

        this.toolId = toolId; // int
        this.id = id; // String
        this.name = name; // String
        this.description = description; // String
        // Contains value deltas of named members
        this.memberDeltas = memberDeltas; // IdValue[]

        this.cost = cost; // IdValue[]
        this.resourceRequirements = resourceRequirements; // IdValue[]
        this.upgradeRequirements = upgradeRequirements; // String[]

        this.isTemplated = false;

        this.meetsResourceReq       = this.meetsResourceReq.bind(this);
        this.meetsUpgradeReq        = this.meetsUpgradeReq.bind(this);
    }

    meetsCost(interactionElement) {
        let result = true;
        for (let req of this.cost) {
            if (GameManager.resourceManager.getResourceValue(req.id) < req.value) {
                GameManager.resourceManager.displayResourceInsufficient(req.id, interactionElement);
                result = false;
            }
        }

        return result;
    }

    meetsResourceReq(resourceIdValues) {
        for (let req of this.resourceRequirements) {
            let resourceObj = resourceIdValues.find(function (element, index, array) {
                return element.id === req.id;
            });

            if (resourceObj == undefined) return false;
            if (resourceObj.value < req.value) return false;
        }

        return true;
    }

    meetsUpgradeReq(activeUpgrades) {
        for (let req of this.upgradeRequirements) {
            if (!activeUpgrades.includes(req)) return false;
        }

        return true;
    }
}

class ToolMembers {

    constructor() {
        // Contains current cached memeber values according to uprades
        this.memberValues = new Map(); // Map<String, Num>

        this.getValue               = this.getValue.bind(this);
        this.applyMemberMultiplier  = this.applyMemberMultiplier.bind(this);
        this.init                   = this.init.bind(this);
    }

    getValue(memberName) {
        return this.memberValues.get(memberName);
    }

    applyMemberMultiplier(memberName, valueMultiplier) {
        let memberVal = this.memberValues.get(memberName);
        if (memberVal == undefined) {
            this.memberValues.set(memberName, 0.0);
        }

        this.memberValues.set(memberName, memberVal * valueMultiplier);
        //this.memberValues.set(memberName, Math.pow(FunLib.clamp(memberVal, 2.0, memberVal), valueMultiplier));
    }

    init(memberIdValues) {
        this.memberValues.clear();

        for (let member of memberIdValues) {
            this.memberValues.set(member.id, member.value);
        }
    }
}

class UpgradeTemplate {
    constructor(toolId, upgradeId, name, description, memberDeltas, initialCostFactors, costFactorScalingRate, initialUpgradeRequirements) {
        this.toolId = toolId; // int
        this.upgradeId = upgradeId; // String
        this.name = name; // String
        this.description = description; // String
        this.memberDeltas = memberDeltas; // IdValue[]
        this.initialCostFactors = initialCostFactors; // IdValue[]
        this.initialUpgradeRequirements = initialUpgradeRequirements; // String[]

        this.costFactorScalingRate = costFactorScalingRate; // number

        this.timesUsed = 0; // int
    }

    nextUse() {
        this.timesUsed++;

        let finalCost = [];
        for (let costFactor of this.initialCostFactors) {
            finalCost.push(new IdValue(
                costFactor.id, 
                GameManager.resourceManager.getLevelReq("money", this.costFactorScalingRate * (this.timesUsed - 1) + costFactor.value, true))
            );
        }

        let finalUpdateRequirements = this.initialUpgradeRequirements.slice(0);
        if (this.timesUsed > 1) {
            finalUpdateRequirements = [this.upgradeId + "_" + (this.timesUsed - 1)];
        }

        let upgrade = new ToolUpgrade(
            this.toolId, this.upgradeId + "_" + this.timesUsed,
            this.name + " " + SymbolDatabase.toRoman(this.timesUsed), this.description,
            this.memberDeltas, finalCost,
            [],
            finalUpdateRequirements
        );
        upgrade.isTemplated = true;

        return upgrade;
    }
}