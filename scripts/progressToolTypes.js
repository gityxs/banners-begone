//
// LifecycleState
//
var LifecycleState = {
    create: 0,
    activate: 1,
    tick: 2,
    inputSucceeded: 3,
    deactivate: 4
}

//
// LifecycleExecutionOrder
//
var LifecycleExecutionOrder = {
    before: 0,
    default: 1,
    after: 2,
}

//
// ExecOrderOverride
//
class ExecOrderOverride {

    constructor(lifecycleState, executionOrder, priority) {
        this.lifecycleState = lifecycleState; // LifecycleState
        this.executionOrder = executionOrder; // LifecycleExecutionOrder
        this.priority = Math.round(priority); // int
    }
}

//
// CompPriority
//
class CompPriority {

    constructor(component, priority) {
        this.component = component; // ToolComponent
        this.priority = Math.round(priority); // int
    }

    static sort(one, two) {
        if (one.priority < two.priority) {
            return -1;
        }

        if (one.priority > two.priority) {
            return 1;
        }

        return 0;
    }
}

//
// ResourceExchangeUnit
//
class ResourceExchangeUnit {

    constructor(givenResource, takenResources) {
        this.givenResource = givenResource; // IdValue
        this.takenResources = takenResources; // IdValue[]
        this.isActive = false;
    }
}