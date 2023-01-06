function TimerInstance(lifespan, timerId, finishedDelegate = null, updatedDelegate = null, repeating = false) {
    this.timerId = timerId;
    this.lifespan = lifespan;
    this.finishedDelegate = finishedDelegate;
    this.updatedDelegate = updatedDelegate;
    this.repeating = repeating;

    this.lifetime = 0.0;
    this.isActive = false;

    this.startTimer = function () {
        this.isActive = true;
        this.lifetime = 0.0;
    }

    this.tickTimer = function (deltaTime) {
        this.lifetime = TimerManager.clamp(this.lifetime + deltaTime, 0.0, this.lifespan);
        if (this.lifetime >= this.lifespan)
            return true;

        return false;
    }

    this.repurposeTimer = function (lifespan, finishedDelegate = null, updatedDelegate = null) {
        this.lifespan = lifespan;
        this.finishedDelegate = finishedDelegate;
        this.updatedDelegate = updatedDelegate;
    }

    this.finishTimer = function () {
        this.isActive = false;
        this.finishedDelegate = null;
        this.updatedDelegate = null;
        this.lifespan = 0.0;
        this.lifetime = 0.0;
    }

    this.getCallbackDelegate = function () { return this.finishedDelegate; }
    this.getUpdatedDelegate = function () { return this.updatedDelegate; }
    this.getLifespan = function () { return this.lifespan; }
    this.getLifetime = function () { return this.lifetime; }
}

function TimerHandle(timerId) {
    this.timerId = timerId;
}

var TimerManager = {
    uniqueTimerCount: 0,
    timers: [],

    /*
    onEnable: function() {
        timers = [];
    }

    onDisable: function() {
        timers = [];
    }
    */

    tick: function(deltaTime) {
        expiredTimers = [];

        for (let timer of this.timers) {
            if (timer.tickTimer(deltaTime)) {
                expiredTimers.push(timer);
            }
            else {
                if (timer.getUpdatedDelegate()) {
                    timer.getUpdatedDelegate()(timer.getLifespan(), timer.getLifetime());
                }
            }
        }

        for (let timer of expiredTimers) {
            if (timer.getCallbackDelegate()) {
                timer.getCallbackDelegate()();
            }

            if (timer.repeating === false) {
                timer.finishTimer();
                this.removeFromArray(this.timers, timer);
            }
            else {
                timer.lifetime = 0;
            }
        }
    },

    setTimer_toHandle: function(timerHandle, lifespan, callbackDelegate = null, updatedDelegate = null) {
        let idCopy = timerHandle.timerId;
        let timer = null;

        for (let t of this.timers) {
            if (t.timerId == idCopy) {
                timer = t;
                break;
            }
        }
                
        if (timer != null) {
            timer.repurposeTimer(lifespan, callbackDelegate, updatedDelegate);
            timer.startTimer();
            return;
        }
        else {
            this.uniqueTimerCount++;

            timer = new TimerInstance(lifespan, this.uniqueTimerCount, callbackDelegate, updatedDelegate);
            if (timer != null) {
                this.timers.push(timer);
                timer.startTimer();
                timerHandle.timerId = timer.timerId;
                return;
            }
        }

        
    },

    setTimer: function(lifespan, callbackDelegate = null, updatedDelegate = null, repeating) {
        this.uniqueTimerCount++;
        let timer = new TimerInstance(lifespan, this.uniqueTimerCount, callbackDelegate, updatedDelegate, repeating);

        if (timer != null) {
            this.timers.push(timer);
            timer.startTimer();
            return new TimerHandle(timer.timerId);
        }

        return new TimerHandle(-1);
    },

    removeTimer: function(timerHandle) {
        let idCopy = timerHandle.timerId;
        let timer = null;

        for (let t of this.timers) {
            if (t.timerId == idCopy) {
                timer = t;
                break;
            }
        }
        timerHandle.timerId = -1;

        if (timer != null) {
            this.removeFromArray(this.timers, timer);
            return true;
        }

        return false;
    },

    isTimerActive: function(timerHandle) {
        let timer = null;

        for (let t of this.timers) {
            if (t.timerId == timerHandle.timerId) {
                timer = t;
                break;
            }
        }

        if (timer == null) return false;

        return true;
    },

    getTimerLifespan: function(timerHandle) {
        let timer = null;

        for (let t of this.timers) {
            if (t.timerId == timerHandle.timerId) {
                timer = t;
                break;
            }
        }

        if (timer == null) return 0.0;

        return timer.getLifespan();
    },

    getTimerLifetime: function (timerHandle) {
        let timer = null;

        for (let t of this.timers) {
            if (t.timerId == timerHandle.timerId) {
                timer = t;
                break;
            }
        }

        if (timer == null) return 0.0;

        return timer.getLifetime();
    },

    getTimerTimeLeft: function (timerHandle) {
        let timer = null;

        for (let t of this.timers) {
            if (t.timerId == timerHandle.timerId) {
                timer = t;
                break;
            }
        }

        if (timer == null) return 0.0;

        return timer.getLifespan() - timer.getLifetime();
    },

    setTimerLifespan: function (timerHandle, newLifespan, resetLifetime) {
        let timer = null;

        for (let t of this.timers) {
            if (t.timerId == timerHandle.timerId) {
                timer = t;
                break;
            }
        }

        if (timer == null) return;

        timer.lifespan = newLifespan;
        if (timer.lifetime > timer.lifespan) {
            timer.lifetime = timer.lifespan;
        }

        if (resetLifetime === true) {
            timer.lifetime = 0;
        }
    },

    clamp: function (num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    },
    removeFromArray: function (array, element) {
        let index = array.indexOf(element);
        if (index !== -1) {
            array.splice(index, 1);
        }
    },
}