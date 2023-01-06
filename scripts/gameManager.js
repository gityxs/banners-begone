var GameManager = {

    inputDiv: null,
    gridInitializer: null,
    resourceManager: null,
    upgradeManager: null,

    beginPlay: function (indexObject) {
        this.saveCooldown = 300.0;
        this.currentSaveCooldown = this.saveCooldown;

        this.indexObject = indexObject;

        this.isDevBuild = false;
        this.isBetaBuild = false;

        this.backwardsCompatabilityList = [];//["0.3.0", "0.4.0", "1.0.0", "1.1.0", "1.1.1"];
        this.gameVersion = "1.2.0";
        this.distributionVendor = "itch.io"; //"newgrounds.com"; //

        this.gameLink = "https://dreadpon.itch.io/banners-begone";
        if (this.distributionVendor === "newgrounds.com") {
            this.gameLink = "https://www.newgrounds.com/portal/view/project/1487217";
        }

        this.totalAdPushes = 0;
        this.bossStarted = false;
        this.bossDefeated = false;
        this.playtime = 0;
        this.saveRequested = false;
        this.gameOverTriggered = false;

        document.querySelector("#pauseGameButton").addEventListener("click", this.pauseGame.bind(this));
        document.querySelector("#manualSaveButton").addEventListener("click", this.manualSave.bind(this));
        document.querySelector("#resetSaveButton").addEventListener("click", this.resetGame.bind(this));
        document.querySelector("#exportSaveButton").addEventListener("click", this.exportSave.bind(this));
        document.querySelector("#importSaveButton").addEventListener("click", this.importSave.bind(this));
        document.querySelector("#fullscreenButton").addEventListener("click", this.toggleFullScreen.bind(this));
        document.querySelector("#importSaveField").addEventListener("change", function (e) { GameManager.gameSave.loadFromDisk(e) });

        document.querySelector("#howToPlayButton").addEventListener("click", function() {
            let container = document.getElementById("textMessage");
            if (container != null && container != undefined) {
                container.remove();
            }
            this.showTextMessages([
                'First, start from pushing ads with the button in the center.<br><br>If you push fast, some ads will freeze,<br>unraveling the game board.',
                'While the ads are frozen, use<br>the minigames to earn resources.<br><br>Use them to reduce ad costs,<br>block them and buy minigame upgrades.',
                'Take your time to study each minigame.<br><br>Understand what it does<br>and what\'s the most efficient way<br>to earn it\'s resources.',
                'If the ad is frozen and you\'re eager<br>to block it, you can click<br>on it\'s blue border to call it in earlier.',
                'Your goal is to clear all the ads<br>from the game board.<br><br>Have fun!']);
        }.bind(this));

        this.pauseGameDiv = document.querySelector("#pauseGameDiv");
        this.pauseGameDiv.children[0].addEventListener("click", this.pauseGame.bind(this));
        document.addEventListener('keydown', function (e) {
            if (e.key == "Escape") {
                this.pauseGame();
            }
        }.bind(this));
        
        this.reviewAnalyticsButton = document.querySelector("#reviewAnalytics");
        this.reviewAnalyticsButton.addEventListener("click", this.showGDPRMessage.bind(this));
        if (this.isBetaBuild === true) {
            this.reviewAnalyticsButton.parentNode.classList.add("hidden");
        }

        this.accessibilityButton = document.querySelector("#accessibilityButton");
        this.accessibilityButton.addEventListener("click", this.showAccessibilityMessage.bind(this));

        let reportBugButton = document.querySelector("#reportBugButton");
        this.reportBugLink = reportBugButton.querySelector("a");
        reportBugButton.addEventListener("click", function () { this.reportBugLink.click(); }.bind(this));

        if (this.isDevBuild === true) {
            let msg = "THIS IS A DEVELOPMENT BUILD AND SHOULD NOT BE SHIPPED";
            console.warn(msg);
            alert(msg);
        }
        
        // GameLoad
        this.gameSave = new GameSave(this.gameVersion);
        this.loadGame();
        this.analyticsManager = new AnalyticsManager(this.gameVersion + " " + this.distributionVendor, this.gameSave.readProperty("GDPR_agreement"));

        if (this.gameSave.isStorageAvailable() === false) {
            GameManager.showSaveMessage(0);
        }

        if (this.gameSave.readProperty("achievedEndlessRank") != null && this.gameSave.readProperty("achievedEndlessRank") != undefined && this.gameSave.readProperty("achievedEndlessRank").gameBeaten === true) {
            this.gameOverTriggered = true;
        }

        this.setButtonBoolState(this.reviewAnalyticsButton, this.gameSave.readProperty("GDPR_agreement"));
        this.setButtonBoolState(this.accessibilityButton, this.gameSave.readProperty("accessibility_state"));

        this.globalEventListener = new GlobalEventListener();
        this.dataPreloader = new DataPreloader();
        this.resourceManager = new ResourceManager();
        this.upgradeManager = new UpgradeManager();
        this.gridInitializer = new GridInitializer();

        this.dataPreloader.preloadAllAdImages();
        this.gridInitializer.initializeTools();
        this.gridInitializer.initializeAds();
        
        if (this.gameSave.readProperty("isEndlessMode") === true) {
            this.upgradeManager.initInfiniteUpgrades();
        }
        this.upgradeManager.updateToLoadedData();
        this.upgradeManager.refreshUpgrades();    
        this.resourceManager.updateToLoadedData();
        this.gridInitializer.updateToLoadedData();
        if (this.gameSave.readProperty("isEndlessMode") === true) {
            this.gridInitializer.loadEndlessMode();
        }

        if (this.gameOverTriggered === true) {
            this.endlessGameOver();
        }

        // GameSave
        this.saveGame();
        this.analyticsManager.saveLoaded();

        if (!this.gameSave.readProperty("introComplete")) {
            this.showIntroductionMessages([
                'Another day on the web,<br>another advertizing hell on the loose...<br><br>\
                They pushed it <mark class="colorInverse">too far</mark> today though,<br>can\'t even check the feed!',
                '<mark class="colorInverse">That\'s it,</mark> let\'s show these ads<br>who\'s the target audience here!<br><br>\
                It\'s time to <mark class="colorInverse">block them all</mark><br>once and for all!'
            ]);
        }

        if (this.gameSave.readProperty("GDPR_agreement") == null || this.gameSave.readProperty("GDPR_agreement") == undefined
            || (this.gameSave.readProperty("GDPR_agreement") === false && this.isBetaBuild === true)) {
            this.showGDPRMessage();
        }
        this.setAccessibility(this.gameSave.readProperty("accessibility_state"));

        window.addEventListener("beforeunload", function (e) {
            let showMsg = GameManager.saveCooldown - GameManager.currentSaveCooldown >= 10;

            GameManager.analyticsManager.endSession();
            GameManager.saveGame_scheduled();

            if (showMsg === true) {
                return "Already leaving?\nYou game was saved just in case :)";
            }
        });
    },

    setButtonBoolState(button, state) {
        if (button == undefined || button == null) return;

        button.classList.remove("color_red", "color_green");
        if (state === true) {
            button.classList.add("color_green");
        }
        else if (button != this.accessibilityButton) {
            //button.classList.add("color_red");
        }
    },

    tick: function (deltaTime) {
        this.playtime += deltaTime * 1000;
        this.gridInitializer.tick(deltaTime);

        // GameSave
        this.gameSave.writeProperty("playtime", this.playtime);

        this.currentSaveCooldown = FunLib.clamp(this.currentSaveCooldown - deltaTime, 0.0, this.saveCooldown);
        if (this.currentSaveCooldown <= 0.0) {
           this.saveGame(true);
        }

        if (this.saveRequested === true) {
            this.saveGame_scheduled();
        }
    },

    saveGame(isAutoSave) {
        if (isAutoSave === true) {
            this.saveRequested = true;
        }
        else {
            // Optimizing save and Game Analytics calls
            // this.saveRequested = true;
        }
    },
    saveGame_scheduled () {
        if (this.bossStarted && !this.bossDefeated) return 2;
        if (!this.bossStarted && this.bossDefeated) return 3;

        this.currentSaveCooldown = this.saveCooldown;
        let result = this.gameSave.saveToStorage();
        this.analyticsManager.sendData();
        console.log("Game Saved!");

        this.saveRequested = false;
        return (result === true) ? 1 : 0;
    },
    manualSave () {
        this.showSaveMessage(this.saveGame_scheduled());
    },
    showSaveMessage(msgCode) {
        switch (msgCode) {
            case 0: {
                this.showSaveResultPopup('<mark class="biggerText"><img src="svg/exclamationMark.svg" alt="exclamationMark" class="iconSymbol"></mark> <p>Cookies are disabled in your browser!<br>Saving can behave unexpectedly.</p>', 0, 12);
                break;
            }
            case 1: {
                this.showSaveResultPopup('<mark class="biggerText"><img src="svg/checkMark.svg" alt="checkMark" class="iconSymbol"></mark> <p>GameSaved!</p>', 1);
            }
                break;
            case 2: {
                this.showSaveResultPopup('<mark class="biggerText"><img src="svg/crossMark.svg" alt="cross" class="iconSymbol"></mark> <p>Can\'t save during boss fight!</p>', 0);
            }
                break;
            case 3: {
                this.showSaveResultPopup('<mark class="biggerText"><img src="svg/questionMark.svg" alt="questionMark" class="iconSymbol"></mark> <p>Game won! No new progress to save.</p>', 2);
            }
                break;
            case 4: {
                this.showSaveResultPopup('<mark class="biggerText"><img src="svg/exclamationMark.svg" alt="exclamationMark" class="iconSymbol"></mark> <p>Game saved. No saving beyond this point!</p>', 0, 8);
            }
                break;
            case 5: {
                this.showSaveResultPopup('<mark class="biggerText"><img src="svg/checkMark.svg" alt="checkMark" class="iconSymbol"></mark> <p>GameSaved. Saving also works during Endless Mode!</p>', 1, 8);
            }
                break;
        }
    },
    loadGame() {
        // GameLoad
        this.gameSave.loadFromStorage();
        this.playtime = this.gameSave.readProperty("playtime");
        this.totalAdPushes = this.gameSave.readProperty("totalAdPushes");
    },
    fullReset() {
        this.gameSave.fullReset();
        location.reload();
    },
    resetGame() {
       this.showEraseSavePrompt();
    },
    resetGame_internal() {
        this.gameSave.resetSave(null);
        this.gameSave.saveToStorage();
        location.reload();
    },


    requestEndlessMode() {
        let container = document.getElementById("endlessModePrompt");
        if (container != null && container != undefined) {
            container.remove();
        }

        container = document.createElement("div");
        container.id = "endlessModePrompt";

        let element = document.createElement("div");
        element.classList.add("endlessModePrompt_container");
        element.insertAdjacentHTML("beforeend", '\
            <h2 class="introductionMessage_title">\
                In <mark class="colorInverse">Endless Mode</mark> you must survive<br>\
                the boss for as long as you can.<br><br>\
                If boss captures the whole board –<br>\
                <mark class="colorInverse">you lose.</mark><br><br>\
                Entering will <mark class="colorInverse">erase you current progress!</mark><br>\
                (you should export it beforehand)<br><br>\
                Do you wish to continue?\
                \
            </h2>\
        ');

        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("endlessModePrompt_buttonContainer");

        let confirmButton = document.createElement("button");
        confirmButton.classList.add("color_green");
        confirmButton.addEventListener("click", function() {
            container.remove();
            this.initiateEndlessMode();
        }.bind(this));
        confirmButton.innerHTML = "Enter<br>Endless Mode"

        let cancelButton = document.createElement("button");
        cancelButton.classList.add("color_red");
        cancelButton.addEventListener("click", function () { container.remove(); });
        cancelButton.textContent = "Cancel"

        buttonContainer.append(confirmButton, cancelButton);
        element.append(buttonContainer);
        container.append(element);

        document.body.append(container);
    },

    initiateEndlessMode() {
        this.gameSave.writeProperty("isEndlessMode", true);
        this.upgradeManager.resetAllUpgrades();
        this.resourceManager.resetAllResources();

        this.playtime = 0;
        this.totalAdPushes = 0;

        this.gridInitializer.initiateEndlessMode();
        this.upgradeManager.initInfiniteUpgrades();

        this.gameSave.resetSave_safe();
        GameManager.gameSave.saveToStorage();
    },


    pauseGame() {
        let state = !this.indexObject.gamePaused;
        this.indexObject.pauseGame(state);

        if (state === false) {
            this.pauseGameDiv.classList.add("hidden");
        }
        else {
            this.pauseGameDiv.classList.remove("hidden");
        }
    },
    toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    },   


    exportSave() {
        this.saveGame_scheduled();
        this.gameSave.saveToDisk();
    },
    importSave() {
        document.querySelector("#importSaveField").click();
    },

    setAccessibility(state) {
        this.gridInitializer.toolCoverage.setAccessibility(state);
    },



    pushAdsBack: function (strength) {
        this.totalAdPushes++;
        this.gridInitializer.adCoverage.offsetAdGrowth(strength);

        // GameSave
        this.gameSave.writeProperty("totalAdPushes", this.totalAdPushes);
        //GameManager.saveGame();
    },

    progressionRequest: function (gridElement, inputScore, resourceIdValue, isTickBased) {
        let resourceCopy = new IdValue(resourceIdValue.id, resourceIdValue.value);
        resourceCopy.value *= inputScore;

        isTickBased = isTickBased == undefined ? false : isTickBased;
        this.resourceManager.applyResourceChange(resourceCopy, gridElement.inputDiv, isTickBased, false, AnalyticsResource.quick("toolReward", "toolName_" + GameData.getFancyToolName(gridElement.id)));
    },

    saveRankData() {
        let totalPlaytime = this.playtime;

        // GameLoad
        let achievedRank = this.gameSave.readProperty("achievedRank");
        if (achievedRank == undefined || achievedRank == null) {

            // GameSave
            achievedRank = new SaveData_Rank(true, totalPlaytime, this.totalAdPushes, this.resourceManager.totalResources);
            this.gameSave.writeProperty("achievedRank", achievedRank);
            this.saveGame();

            this.analyticsManager.rankAchieved([totalPlaytime, this.resourceManager.totalResources]);
        }
    },
    saveEndlessRankData(endlessScore) {
        // GameLoad
        let achievedEndlessRank = this.gameSave.readProperty("achievedEndlessRank");
        if (achievedEndlessRank == undefined || achievedEndlessRank == null) {

            // GameSave
            achievedEndlessRank = new SaveData_EndlessRank(true, endlessScore, this.resourceManager.totalResources);
            this.gameSave.writeProperty("achievedEndlessRank", achievedEndlessRank);
            this.saveGame();
        }
    },
    gameWon() {
        // GameLoad
        let achievedRank = this.gameSave.readProperty("achievedRank");

        let gameWonScreen = this.constructGameWon(achievedRank.playtime, achievedRank.resources, achievedRank.totalAdPushes, this.resetGame);
        document.body.appendChild(gameWonScreen);
    },
    constructGameWon(playtime, resources, adPushes, restartCallback) {
        // <p>Ad-Pusher Uses – <mark class="colorInverse">the less</mark>, the better</p>\
        // <br>(all resources count as one stat)</p>\

        let scores = HighScores.getRankScores(playtime, resources);

        let element = document.createElement("div");
        element.id = "gameWonScreen";
        element.insertAdjacentHTML("beforeend", '\
        <div class="gameWonContainer">\
            <h1 class="gameWon_header">\
                You win!<br>\
                Ads no more!\
            </h1>\
            <h2 class="gameWon_title">\
                Another part of the internet was freed from invasive advertizing!<br>\
                But the war still goes on...\
            </h2>\
            <div class="gameWon_stats">\
                <div class="gameWon_statHint">\
                    <p><mark class="colorInverse">?</mark></p>\
                    <div class="gameWon_statHintContent hidden">\
                        <p>\
                            Your final rank is calculated from four stats:<br>\
                            <mark class="colorInverse">time</mark> <mark class="colorInverse">earned ' + SymbolDatabase.getSymbol("money") + '</mark> <mark class="colorInverse">earned ' + SymbolDatabase.getSymbol("adStrike")  + '</mark> and <mark class="colorInverse">earned ' + SymbolDatabase.getSymbol("encryption")  + '</mark>\
                        </p>\
                        <p>\
                            <br>Here\'s your list of individual ranks for every stat:<br><br>\
                        </p>\
                        <p>\
                            Time: <mark class="colorInverse">' + HighScores.getRankText(scores.time).letter + '</mark><br>\
                            Earned ' + SymbolDatabase.getSymbol("money") + ': <mark class="colorInverse">' + HighScores.getRankText(scores.money).letter + '</mark><br>\
                            Earned ' + SymbolDatabase.getSymbol("adStrike") + ': <mark class="colorInverse">' + HighScores.getRankText(scores.adStrike).letter + '</mark><br>\
                            Earned ' + SymbolDatabase.getSymbol("encryption") + ': <mark class="colorInverse">' + HighScores.getRankText(scores.encryption).letter + '</mark><br>\
                        </p>\
                    </div>\
                </div>\
            </div>\
            <div class="gameWon_rank">\
                <p class="gameWon_rank_text"></p>\
            </div>\
            <div class="gameWon_thanks">\
                <p class="gameWon_title">\
                    Thank you for playing!<br>\
                </p>\
                 <p class="gameWon_title">\
                    Rate on <a href="' + this.gameLink + '" target="_blank">' + this.distributionVendor + '!</a>\
                </p>\
                <p class="gameWon_title">\
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSfB8Z86J5-Cpr763EQRG3IpwKn_YPuZOPT95MVerHhodmGAMQ/viewform?usp=sf_link" target="_blank" class="buttonLinkWrapper"><button><p>And take the Feedback Survey!</p></button></a>\
                </p>\
                <div class="gameWon_title gameWon_media">\
                    <a class="clickableGridElement" href="https://discord.gg/CzRSk8E" target="_blank">\
                        <img alt="on discord" src="logos/discord.png">\
                    </a>\
                    <a class="clickableGridElement" href="https://www.reddit.com/user/Dreadpon" target="_blank">\
                        <img alt="on reddit" src="logos/reddit.png">\
                    </a>\
                </div>\
            </div>\
            <div class="gameWon_replay">\
                <button class="gameWon_replay_button">Reset to play again!</button>\
            </div>\
        </div>\
        ');

        element.querySelector(".gameWon_replay_button").addEventListener("click", restartCallback.bind(this));

        let gameWon_statHint = element.querySelector(".gameWon_statHint");
        let gameWon_statHintContent = gameWon_statHint.querySelector(".gameWon_statHintContent");
        gameWon_statHint.addEventListener("mouseover", function () { gameWon_statHintContent.classList.remove("hidden"); }.bind(this));
        gameWon_statHint.addEventListener("mouseleave", function () { gameWon_statHintContent.classList.add("hidden"); }.bind(this));

        let gameWon_stats = element.querySelector(".gameWon_stats");
        let statsCreated = 2;
        statsCreated++;
        gameWon_stats.append(this.constructGameWonStat("Completion Time", this.convertToTime(playtime), statsCreated * 0.5));
        //statsCreated++;
        //gameWon_stats.append(this.constructGameWonStat("Used Ad-Pusher", adPushes + " times", statsCreated * 0.5));
        for (let resource of resources) {
            statsCreated++;
            gameWon_stats.append(this.constructGameWonStat("Earned " + SymbolDatabase.getSymbol(resource.id), ResourceManager.formatResource(resource.value, 3), statsCreated * 0.5));
        }

        statsCreated++;
        element.querySelector(".gameWon_rank_text").innerHTML = HighScores.getRankString(scores.average);
        element.querySelector(".gameWon_rank").style["animation-delay"] = statsCreated * 0.5 + "s";

        return element;
    },
    constructGameWonStat(name, value, animDelay) {
        let element = document.createElement("div");
        element.classList.add("gameWon_stat");
        element.insertAdjacentHTML("beforeend", '\
            <p class="gameWon_stat_name">' + name + '</p><p class="gameWon_stat_border">|</p><p class="gameWon_stat_value">' + value + '</p>\
        ');
        for (let child of element.children) {
            child.style["animation-delay"] = animDelay + "s";
        }

        return element;
    },
    convertToTime(milliseconds) {
        let m_days = 24 * 60 * 60 * 1000;
        let m_hours = 60 * 60 * 1000;
        let m_mins = 60 * 1000;
        let m_secs = 1000;

        let days = Math.floor(milliseconds / m_days);
        let hours = Math.floor((milliseconds - days * m_days) / m_hours);
        let mins = Math.floor((milliseconds - days * m_days - hours * m_hours) / m_mins);
        let secs = Math.round((milliseconds - days * m_days - hours * m_hours - mins * m_mins) / m_secs);

        let pad = function (n) { return n < 10 ? '0' + n : n; };

        if (secs === 60) {
            mins++;
            secs = 0;
        }
        if (mins === 60) {
            hours++;
            mins = 0;
        }
        if (hours === 24) {
            days++;
            hours = 0;
        }

        let daysString = days + " days ";
        let hoursString = pad(hours) + "h ";
        let minsString = pad(mins) + "m " ;
        let secsString = pad(secs) + "s";
        if (days <= 0) {
            daysString = "";

            if (hours <= 0) {
                hoursString = "";

                if (mins <= 0) {
                    minsString = "";
                }
            }
        }
        
        return daysString + hoursString + minsString + secsString;
    },

    endlessGameOver() {
        // GameLoad
        let achievedEndlessRank = this.gameSave.readProperty("achievedEndlessRank");
        this.gameOverTriggered = true;

        let gameOverScreen = this.constructGameOver(achievedEndlessRank.endlessScore, achievedEndlessRank.resources, this.resetGame);
        document.body.appendChild(gameOverScreen);
    },
    constructGameOver(endlessScore, resources, restartCallback) {
        let scores = HighScores.getEndlessRankScores(endlessScore, resources);

        let element = document.createElement("div");
        element.id = "gameWonScreen";
        element.insertAdjacentHTML("beforeend", '\
        <div class="gameWonContainer">\
            <h1 class="gameWon_header">\
                Game Over!<br>\
            </h1>\
            <h2 class="gameWon_title">\
                ... or merely a setback?\
            </h2>\
            <div class="gameWon_stats">\
                <div class="gameWon_statHint">\
                    <p><mark class="colorInverse">?</mark></p>\
                    <div class="gameWon_statHintContent hidden">\
                        <p>\
                            In endless mode, only your <mark class="colorInverse">score</mark> affects your rank.<br>\
                        </p>\
                        <p>\
                            <br>However this time, each rank is a fruit!<br>\
                            (or a vegetable)\
                        </p>\
                        <p>\
                            <br>Ranks are arranged in alphabetical order<br>\
                            from Z to A, with S meaning "special".\
                        </p>\
                    </div>\
                </div>\
            </div>\
            <div class="gameWon_rank endless">\
                <p class="gameWon_rank_text"></p>\
            </div>\
            <div class="gameWon_thanks">\
                <p class="gameWon_title">\
                    Thank you for playing!\
                </p>\
                <p class="gameWon_title">\
                    <br>\
                    You can always try the <mark class="colorInverse">Endless Mode</mark><br>\
                    again by restarting the game.\
                </p>\
                <p style="{white-space: pre;}"><br><br></p>\
            </div>\
            <div class="gameWon_replay">\
                <button class="gameWon_replay_button">Reset to play again!</button>\
            </div>\
        </div>\
        ');

        element.querySelector(".gameWon_replay_button").addEventListener("click", restartCallback.bind(this));

        let gameWon_statHint = element.querySelector(".gameWon_statHint");
        let gameWon_statHintContent = gameWon_statHint.querySelector(".gameWon_statHintContent");
        gameWon_statHint.addEventListener("mouseover", function () { gameWon_statHintContent.classList.remove("hidden"); }.bind(this));
        gameWon_statHint.addEventListener("mouseleave", function () { gameWon_statHintContent.classList.add("hidden"); }.bind(this));

        let gameWon_stats = element.querySelector(".gameWon_stats");
        let statsCreated = 1;
        statsCreated++;
        gameWon_stats.append(this.constructGameOverStat("Endless Score", ResourceManager.formatResource(endlessScore, 3), statsCreated * 0.5));

        statsCreated++;
        element.querySelector(".gameWon_rank_text").innerHTML = HighScores.getEndlessRankString(scores.average);
        element.querySelector(".gameWon_rank").style["animation-delay"] = statsCreated * 0.5 + "s";

        return element;
    },
    constructGameOverStat(name, value, animDelay) {
        let element = document.createElement("div");
        element.classList.add("gameWon_stat", "gameOver");
        element.insertAdjacentHTML("beforeend", '\
            <p class="gameWon_stat_name">' + name + '</p><p class="gameWon_stat_border">|</p><p class="gameWon_stat_value">' + value + '</p>\
        ');
        for (let child of element.children) {
            child.style["animation-delay"] = animDelay + "s";
        }

        return element;
    },



    
    showIntroductionMessages(messageList) {
        let container = document.getElementById("introductionMessage");
        if (container == null || container == undefined) {
            container = document.createElement("div");
            container.id = "introductionMessage";
            document.body.append(container);
        }

        let element = document.createElement("div");
        element.classList.add("introductionMessageContainer");
        element.insertAdjacentHTML("beforeend", '\
            <h2 class="introductionMessage_title">' + messageList[0] + '</h2>\
            <div class="introductionMessage_skip">\
                <button class="introductionMessage_skip_button">' + (messageList.length > 1 ? 'Next' : 'Close') + '</button>\
            </div>\
        ');

        container.appendChild(element);
        messageList.shift();

        element.querySelector(".introductionMessage_skip_button").addEventListener("click", function() {
            element.remove();
            if (messageList != undefined && messageList.length > 0) {
                this.showIntroductionMessages(messageList);
            }
            else {
                container.remove();

                // GameSave
                this.gameSave.writeProperty("introComplete", true, true);
                this.analyticsManager.startLevel("baseBoard");
            }
        }.bind(this));
    },

    showTextMessages(messageList) {
        let container = document.getElementById("textMessage");
        if (container == null || container == undefined) {
            container = document.createElement("div");
            container.id = "textMessage";
            document.body.append(container);
        }

        let element = document.createElement("div");
        element.classList.add("introductionMessageContainer");
        element.insertAdjacentHTML("beforeend", '\
            <h2 class="introductionMessage_title">' + messageList[0] + '</h2>\
            <div class="introductionMessage_skip">\
                <button class="introductionMessage_skip_button">' + (messageList.length > 1 ? 'Next' : 'Close') + '</button>\
            </div>\
        ');

        container.appendChild(element);
        messageList.shift();

        element.querySelector(".introductionMessage_skip_button").addEventListener("click", function () {
            element.remove();
            if (messageList != undefined && messageList.length > 0) {
                this.showTextMessages(messageList);
            }
            else {
                container.remove();
            }
        }.bind(this));
    },

    showEraseSavePrompt() {
        let container = document.getElementById("saveErasePrompt");
        if (container != null && container != undefined) {
            container.remove();
        }

        container = document.createElement("div");
        container.id = "saveErasePrompt";

        let element = document.createElement("div");
        element.classList.add("saveErasePrompt_container");
        element.insertAdjacentHTML("beforeend", '\
            <h2 class="introductionMessage_title">You are about to <mark class="colorInverse">reset your save file!</mark><br>Do you wish to continue?</h2>\
        ');

        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("saveErasePrompt_buttonContainer");
        
        let confirmButton = document.createElement("button");
        confirmButton.classList.add("saveErasePrompt_buttonContainer_confirmButton");
        confirmButton.addEventListener("click", this.resetGame_internal.bind(this));
        confirmButton.textContent = "Reset the file"

        let cancelButton = document.createElement("button");
        cancelButton.classList.add("saveErasePrompt_buttonContainer_cancelButton");
        cancelButton.addEventListener("click", function () { container.remove(); });
        cancelButton.textContent = "Cancel"

        buttonContainer.append(confirmButton, cancelButton);
        element.append(buttonContainer);
        container.append(element);

        document.body.append(container);
    },

    showGDPRMessage() {
        let container = document.getElementById("GDPRMessage");
        if (container == null || container == undefined) {
            container = document.createElement("div");
            container.id = "GDPRMessage";
            document.body.append(container);
        }
        container.innerHTML = "";

        let message = "";
        if (this.isBetaBuild === true) {
            message = '\
                Thank you for participating in<br>\
                "Banners Begone!" beta!<br><br>\
                During beta periods, your gameplay data<br>\
                will be collected and processed<br>\
                to improve future gameplay experience.<br><br>\
                <mark class="smallerText"><p><a href="https://gameanalytics.com/privacy" target="_blank">Game Analytics Privacy Policy</a><br>\
                As per Game Analytics Terms of Service, all collected data<br>can be used for analytics and marketing purposes</p></mark>\
                ';
        }
        else {
            message = '\
                When playing "Banners Begone!"<br>\
                your gameplay data can help find<br>\
                gameplay weakpoints and improve them<br><br>\
                Do you allow anonymous collection and processing of this data?<br><br>\
                <mark class="smallerText"><p><a href="https://gameanalytics.com/privacy" target="_blank">Game Analytics Privacy Policy</a><br>\
                As per Game Analytics Terms of Service, all collected data<br>can be used for analytics and marketing purposes</p></mark>\
                ';
        }

        let buttons = "";
        if (this.isBetaBuild === true) {
            buttons = '\
                <button class="GDPRMessage_agree_button color_green">Continue</button>\
                ';
        }
        else {
            buttons = '\
                <button class="GDPRMessage_agree_button color_green manyButton">Allow</button>\
                <button class="GDPRMessage_decline_button color_red manyButton">Forbid</button>\
                ';
        }

        let element = document.createElement("div");
        element.classList.add("GDPRMessageContainer");
        element.insertAdjacentHTML("beforeend", '\
            <h2 class="introductionMessage_title">' + message +'</h2>\
            <div class="GDPRMessage_buttons">' + buttons + '</div>\
            ');

        container.appendChild(element);

        element.querySelector(".GDPRMessage_agree_button").addEventListener("click", function () {
            container.remove();
            this.gameSave.writeProperty("GDPR_agreement", true);
        }.bind(this));
        
        if (this.isBetaBuild === false) {
            element.querySelector(".GDPRMessage_decline_button").addEventListener("click", function () {
                container.remove();
                this.gameSave.writeProperty("GDPR_agreement", false);
            }.bind(this));
        }
    },
    showAccessibilityMessage() {
        let container = document.getElementById("accessibilityMessage");
        if (container == null || container == undefined) {
            container = document.createElement("div");
            container.id = "accessibilityMessage";
            document.body.append(container);
        }
        container.innerHTML = "";

        let message = '\
            If you find trouble clicking all the time,<br>\
            you can enable "Motor Accessibility Mode"<br><br>\
            In this mode you can <mark class="colorInverse">hold</mark> to interact<br>\
            with any tool automatically.<br><br>\
            Don\'t worry, you\'ll still be able to click<br>as normal if you want to!\
            ';

        let buttons = '\
            <button class="accessibilityMessage_agree_button color_green manyButton">Enable</button>\
            <button class="accessibilityMessage_decline_button color_red manyButton">Disable</button>\
            ';

        let element = document.createElement("div");
        element.classList.add("accessibilityMessageContainer");
        element.insertAdjacentHTML("beforeend", '\
            <h2 class="introductionMessage_title">' + message + '</h2>\
            <div class="accessibilityMessage_buttons">' + buttons + '</div>\
            ');

        container.appendChild(element);

        element.querySelector(".accessibilityMessage_agree_button").addEventListener("click", function () {
            container.remove();
            this.gameSave.writeProperty("accessibility_state", true);
            this.setAccessibility(true);
        }.bind(this));

        if (this.isBetaBuild === false) {
            element.querySelector(".accessibilityMessage_decline_button").addEventListener("click", function () {
                container.remove();
                this.gameSave.writeProperty("accessibility_state", false);
                this.setAccessibility(false);
            }.bind(this));
        }
    },
    showSaveResultPopup(text, resultState, lifetime) {
        if (lifetime == null || lifetime == undefined) {
            lifetime = 2;
        }

        let container =  document.createElement("div");
        container.classList.add("saveResultPopup");
        document.body.append(container);
        container.innerHTML = "";

        let element = document.createElement("div");
        element.classList.add("saveResultPopupContainer");
        element.insertAdjacentHTML("beforeend", '\
            <h2 class="introductionMessage_title">' + text + '</h2>\
        ');

        if (resultState === 0) {
            element.classList.add("color_red");
        }
        else if (resultState === 1) {
            element.classList.add("color_green");
        }
        else if (resultState === 2) {
            element.classList.add("color_blue");
        }

        element.style["animation-duration"] = lifetime + "s";

        container.appendChild(element);
        TimerManager.setTimer(lifetime, function () {
            container.remove();
        }.bind(this));
    },
}



var ElementLibrary = {

    constructTool: function (id, displayText, clickCallback) {
        let element = document.createElement("div");
        element.className += "toolSelector";
        element.setAttribute("tool_id", id);
        element.insertAdjacentHTML('beforeend', "<p>" + displayText + "</p>");

        element.addEventListener("click", clickCallback);

        return element;
    }
}



var GameData = {

    getFancyToolName(id) {
        switch (id) {
            case 1000:
                return "Ad-Pusher";

            case 0:
                return "Ad-Blocker";

            case 1:
                return "Gesture";

            case 2:
                return "Fishing";

            case 3:
                return "Freelancing";

            case 4:
                return "Click-Out";

            case 5:
                return "Cryptography";

            case 6:
                return "Upgrade";

            case 7:
                return "Sellout";

            case 8:
                return "Hackathon";

            case 9:
                return "AI-Tech";

            case 10:
                return "Skill-Exchange";

            case 11:
                return "Surprise-Mechanic";

            case 100:
                return "Locked";
        }
    },

    constructTool: function (id, progressionRequest, paramArray) {
        switch (id) {
            case 1000:
                return new ProgressTool(
                    id,
                    new ClickInputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new MainToolComponent([])
                    ],
                    //[new IdValue("adStrike", 1.0)]
                )

            case 0:
                return new ProgressTool(
                    id,
                    new InputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new ChargeMinigameComponent([]),
                        new ApmComponent([])
                    ],
                    [new IdValue("adStrike", 1.0)]
                )

            case 1: 
                return new ProgressTool(
                    id,
                    new ClickInputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new ResourceGestureComponent([])
                    ]
                )

            case 2:
                return new ProgressTool(
                    id,
                    new AutoInputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new FishingComponent([])
                    ]
                )

            case 3:
                return new ProgressTool(
                    id,
                    new ClickInputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new PowerBoundsComponent([])
                    ],
                    [new IdValue("money", 1)]
                )

            case 4:
                return new ProgressTool(
                    id,
                    new ClickInputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new PowerChargeComponent([])
                    ]
                )

            case 5:
                return new ProgressTool(
                    id,
                    new ButtonsInputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new CorrectStreakComponent([])
                    ],
                    [new IdValue("encryption", 1)]
                )

            case 6:
                return new ProgressTool(
                    id,
                    new MenuListHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new UpgradeComponent([], paramArray[0], (paramArray.length >= 2 ? paramArray[1] : null))
                    ],
                    []
                )

            case 7:
                return new ProgressTool(
                    id,
                    new MenuListHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new AdSelloutComponent([])
                    ],
                    []
                )

            case 8:
                return new ProgressTool(
                    id,
                    new MenuListHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new InvestementComponent([])
                    ],
                    []
                )

            case 9:
                return new ProgressTool(
                    id,
                    new MenuListHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new PassiveIncomeComponent([])
                    ],
                    []
                )

            case 10:
                return new ProgressTool(
                    id,
                    new MenuListHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new ResourceExchangeComponent([])
                    ],
                    []
                )

            case 11:
                return new ProgressTool(
                    id,
                    new MenuListHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new SurpriseMechanicComponent([], paramArray[0])
                    ],
                    []
                )

            case 100:
                return new ProgressTool(
                    id,
                    new InputHandler(),
                    new ToolWorker(["Def"]),
                    progressionRequest,
                    [
                        new LockedStateComponent([], paramArray[0], paramArray[1])
                    ]
                );
        }
    },

    toolList: [

    ]
}



function ToolWorker(progressSpecifiers) {

    this.progressSpecifiers = progressSpecifiers; // String[]

    this.getProgress = function (targetBlock, inputScore) {
        //return targetBlock.getProgressMultiplier(progressSpecifiers) * inputScore;
        return inputScore;
    }
}

function WorldBlock(maxDurability, progressMultipliers, resourceRewards) {

    this.maxDurability = maxDurability; // int
    this.currentDurability = maxDurability; // int
    this.progressMultipliers = progressMultipliers; // IdValue[]
    this.resourceRewards = resourceRewards; // IdValue[]

    this.getProgressMultiplier = function (progressSpecifiers) {
        let multiplier = 1.0;

        for (index = 0; index < progressMultipliers.length; index++) {
            if (progressSpecifiers.includes(progressMultipliers[index].id)) {
                multiplier *= progressMultipliers[index].value;
            }            
        }

        return multiplier;
    }.bind(this);

    this.applyDurabilityChange = function (delta) {
        this.currentDurability += delta;
        if (this.currentDurability <= 0) {
            this.currentDurability = 0;
            return true;
        }
        return false;
    }.bind(this);
}

function IdValue(id, value) {

    this.id = id; // String || int
    this.value = value; // any
}