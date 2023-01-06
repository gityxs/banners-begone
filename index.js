(function () {
    var Index = {
        powerTriggerHeld: false,
        lastTick: Date.now(),
        maxFPS: 60.0,
        maxFramerate: 1.0 / this.maxFPS * 1000.0,
        gamePaused: false,
        tickMultiplier: 1.0,

        pausedElements: [],


        browserCheck: function () {

            let isChromium = window.chrome;
            let winNav = window.navigator;
            let vendorName = winNav.vendor;
            let isOpera = typeof window.opr !== "undefined";
            let isIEedge = winNav.userAgent.indexOf("Edge") > -1;
            let isIOSChrome = winNav.userAgent.match("CriOS");
            let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

            if (isChromium !== null &&
                typeof isChromium !== "undefined" &&
                vendorName === "Google Inc." &&
                isOpera === false &&
                isIEedge === false
            ) {
                return true;
            } else if (isFirefox === true) {
                 return true;
            }

            return false;
        },
        showBrowserCheckError: function () {
            //alert("Recommended browsers are: \nChrome on PC, Firefox on PC \nStability is not guaranteed when using other browsers")
        },


        beginPlay: function () {

            setTimeout(function() { Index.rootTick(); }, 1);

            GameManager.beginPlay(this);
        },

        pauseGame: function (pause) {
            this.gamePaused = pause;

            if (pause === true) {
                document.querySelectorAll('*').forEach(function (element) {
                    if (element == GameManager.pauseGameDiv) return;
                    if (element.parentNode == GameManager.pauseGameDiv) return;

                    if (window.getComputedStyle(element, null).getPropertyValue("animation-play-state") === "running") {
                        element.style["animation-play-state"] = "paused";
                        this.pausedElements.push(element);
                    }
                }.bind(this));
            }
            else {
                for (let element of this.pausedElements) {
                    element.style["animation-play-state"] = "running";
                }
                this.pausedElements.length = 0;
            }
        },

        rootTick: function () {
            var timeNow = Date.now();
            var deltaTime = timeNow - this.lastTick;

            this.tick(deltaTime / 1000.0);

            timeNow = Date.now();
            deltaTime = timeNow - this.lastTick;
            this.lastTick = timeNow;

            var targetDeltaTime = this.maxFramerate;
            if (deltaTime > this.maxFramerate) {
                targetDeltaTime = this.maxFramerate - (deltaTime - this.maxFramerate);
                targetDeltaTime = targetDeltaTime < 1 ? 1 : targetDeltaTime;
            }

            setTimeout(function () { Index.rootTick(); }, targetDeltaTime);
        },

        tick: function (deltaTime) {
            if (this.gamePaused) return;

            TimerManager.tick(deltaTime * this.tickMultiplier);
            GameManager.tick(deltaTime * this.tickMultiplier);
        },
    }
    

    Index.beginPlay();

    // if (Index.browserCheck() == false) {
    //     Index.showBrowserCheckError();
    // }
    // else {
    //     Index.beginPlay();
    // }
})();
