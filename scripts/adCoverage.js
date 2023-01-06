class AdCoverage {

    constructor(gridManager) {
        this.adCovers = []; // AdCover[]
        this.totalAdCovers = 0;
        this.gridManager = gridManager;

        this.currentEncryptedAd = null // AdCover
        this.encryptTime = 0.0;

        this.tick                   = this.tick.bind(this);
        this.initAdCover            = this.initAdCover.bind(this);
        this.offsetAdGrowth         = this.offsetAdGrowth.bind(this);
        this.purgeAd                = this.purgeAd.bind(this);
        this.removeAd               = this.removeAd.bind(this);
        this.hostRandomSponsoredAd  = this.hostRandomSponsoredAd.bind(this);
        this.purgeNotify = this.purgeNotify.bind(this);
    }

    tick(deltaTime) {
        for (let adCover of this.adCovers) {
            adCover.tick(deltaTime);
        }
    }

    initAdCover(adCover, silently) {
        if (adCover == undefined || adCover == null) return;

        adCover.setId(++this.totalAdCovers);
        adCover.constructElement();
        this.gridManager.addGridElement(adCover, adCover.gridBounds);

        document.getElementById("mainGridContainer").appendChild(adCover.layoutElement);
        adCover.setGrow(1.0);
        adCover.addEncryption(0);
        adCover.offsetHeight;
        let imgSrc = adCover.setAdImage();

        if (!(adCover instanceof BossAdCover)) {
            adCover.setGrow(0.0); 
        }

        if (silently == null || silently == undefined || !silently) {
            this.adCovers.push(adCover);
            adCover.purgeCallbacks.push(this.purgeAd);
            adCover.purgeNotifies.push(this.purgeNotify);
            //adCover.encryptCallback = this.encryptAd;
        }

        adCover.activate();
        
        if (!adCover.isBossPart) {
            // GameLoad
            let saveData = GameManager.gameSave.readProperty("adsData")[adCover.id];
            if (saveData == undefined || saveData == null) {
                // GameSave
                GameManager.gameSave.readProperty("adsData")[adCover.id] = new SaveData_Ad(adCover.id, false, adCover.gridBounds, adCover.encryptionScore, adCover.imgSrc, adCover.cachedPurgeCostOffset, adCover.adDifficulty, adCover.growDirection);
            } 
        }    

        return adCover;
    }

    offsetAdGrowth(strength) {
        for (let adCover of this.adCovers) {
            adCover.offsetGrow(-strength);
        }
    }

    purgeAd(adCover) {
        this.removeAd(adCover);
        GameManager.upgradeManager.refreshUpgrades();
    }

    removeAd(adCover) {
        GameManager.resourceManager.remove_resourceChangedCallback(adCover.resourceChanged);
        this.gridManager.removeGridElement(adCover);
        adCover.layoutElement.remove();

        if (!adCover.isBossPart) {
            // GameSave
            GameManager.gameSave.readProperty("adsData")[adCover.id].isBlocked = true;
            GameManager.saveGame();
        }
    }
    purgeNotify(adCover) {
        FunLib.removeFromArray(this.adCovers, adCover);

            if (this.adCovers.length <= 1 && !GameManager.bossDefeated && !(adCover instanceof BossAdCover)) {
                let remainingAd = this.adCovers[0];

                if ((remainingAd == undefined || remainingAd == null)
                    || GameManager.gameSave.readProperty("adsData")[remainingAd.id].isBlocked === false && adCover.isBossPart === false) {

                    let remainingAdCover = null;
                    for (let ad of this.adCovers) {
                        if (ad != adCover) {
                            remainingAdCover = ad;
                            break;
                        }
                    }

                    if (GameManager.gameSave.readProperty("isEndlessMode") != true) {
                        this.prepareBossForAwakening(remainingAdCover, adCover);
                    }
                }
            }
    }

    prepareBossForAwakening(remainingAdCover, purgedAdCover) {
        if (remainingAdCover == null || remainingAdCover == undefined) {
            this.continueSpawningBoss(null);
            return;
        }

        remainingAdCover.purgeCallbacks = [];
        remainingAdCover.purgeNotifies = [function () {
            this.continueSpawningBoss(remainingAdCover);
        }.bind(this)];

        remainingAdCover.adDifficulty = [0, 0, 0];

        remainingAdCover.cachedPurgeCostOffset = -Infinity;
        remainingAdCover.purgeCost_min = 0;
        remainingAdCover.purgeCost = 0;
        remainingAdCover.resourceChanged(new IdValue("adStrike", 0));
        remainingAdCover.shouldFinishSelfPurging = false;

        remainingAdCover.adPurgeX.innerHTML = "AWAKEN";
        remainingAdCover.adPurgeCost.innerHTML = "À̵͚̺͝Ẃ̶̧̰̊̀/̷̝͑̐̏K̶̭̣̎͠Ḙ̸̟͈̎̾Ṅ̶̮̜̮";
        remainingAdCover.adEncryptV.innerHTML = "A̵͓̭̽͌/̶̯̖̩̓͒ ̶̩͚͛̕͜͠\̴̗͓̳̔͊͝/̷̡͙̮̥̑͌̃͑K̷̦͈̈́̃̕͝Ȇ̷̖̫͔͇͑|̴̾͠ͅ ̸̨̘͔̗̌̐̃͘|̶̛͕̲͙̋̋";
        remainingAdCover.adEncryptScore.innerHTML = "/̸̥̦̭̩̣̠̍͊́͗ ̷̤̇͋͜/̴̤̤̫̎̏͠ ̸͚̰̒́͆̆͑\̵͇̠̺̱͆̎̀̿̒/̷̡̤͆́̈͑̇̌̀͝|̶̛̭͇̫̟͉̯̉̑͆̐̿̐͛ͅͅ ̶̦̣̤̩̱̠̍͑͆̑ͅ|̸͇̲̯̫̠͔̲̓́͛̉̈́ ̸̡̬͙̲̓̿́̾̀̃̓̊ͅ|̸̞̦̘͔̜̙̳̍ ̵̨̛̩͑̂̒́͒|̷̮̻͓̞̙̥̆̈́̄̇̈͘͝͠";
    }
    continueSpawningBoss(remainingAdCover) {
        GameManager.gridInitializer.startBossFight(remainingAdCover);

        GameManager.analyticsManager.completeLevel("baseBoard");
        GameManager.analyticsManager.startLevel("bossBoard");
    }

    hostRandomSponsoredAd(adSpeed, adResistance, adRevenue) {
        let freeTiles = GameManager.gridInitializer.getAdFreeCells();
        if (freeTiles.length <= 0) return false;

        let randIndex = Math.round(Math.random() * (freeTiles.length - 1));
        let adCoord = [freeTiles[randIndex].coord.x, freeTiles[randIndex].coord.y, freeTiles[randIndex].coord.x + 1, freeTiles[randIndex].coord.y + 1];

        let selloutAdCover = new SelloutAdCover(
            adCoord,
            new Vector2(1, 0),
            adSpeed,
            adResistance,
            adRevenue,
            100,
            "Sell Ad 1!",
            "Here comes da money",
        );

        this.initAdCover(selloutAdCover);
        selloutAdCover.purgeCallbacks.push(this.removeAd);
        return true;
    }

    purgeAllAds(force) {
        for (let index = this.adCovers.length - 1; index >= 0; index--) {
            let adCover = this.adCovers[index];
            if (adCover.invulnerable === true) continue;

            // if (force != true) {
                adCover.requestPurge(null, true);
            // }
            // else {
            //     this.purgeAd(adCover);
            // }
        }

        if (GameManager.gameSave.readProperty("isEndlessMode") === true) {
            let remainingAd = this.adCovers[0];

            if (remainingAd != undefined && remainingAd != null) {
                this.continueSpawningBoss(remainingAd)
            }
        }
    }
}