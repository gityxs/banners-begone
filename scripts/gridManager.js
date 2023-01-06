class GridCell {

    constructor(coord) {
        this.coord = new Vector2(coord[0], coord[1]);
        this.boundObjects = [];

        this.bindObject     = this.bindObject.bind(this);
        this.unbindObject   = this.unbindObject.bind(this);
        this.isObjectBound  = this.isObjectBound.bind(this);
        this.containsAnyAd  = this.containsAnyAd.bind(this);
    }

    bindObject(obj) {
        this.boundObjects.push(obj);
    }

    unbindObject(obj) {
        FunLib.removeFromArray(this.boundObjects, obj);
    }

    isObjectBound(obj) {
        return boundObjects.some(o => o == obj);
    }

    containsAnyAd() {
        for (let object of this.boundObjects) {
            if (object instanceof AdCover) return true;
        }

        return false;
    }

    containsAnyTool() {
        for (let object of this.boundObjects) {
            if (object instanceof ToolGridElement) return true;
        }

        return false;
    }

    containsAnyObject() {
        if (this.boundObjects.length > 0) return true;

        return false;
    }
}

class GridManager {

    constructor(gridSize) {
        this.gridArray = [];

        for (let x = 0; x < gridSize[0]; x++) {
            this.gridArray.push([]);

            for (let y = 0; y < gridSize[1]; y++) {
                this.gridArray[x].push(new GridCell([x, y]));
            }
        }

        this.mainGridContainerWrapper = document.getElementById("mainGridContainerWrapper");
        this.mainGridContainer = document.getElementById("mainGridContainer");
        this.bossAnimationData = null;

        this.maxGridInterpolationSpeed = 0.5;
        this.lengthLimit = 0.5;
        this.gridInterpolationSpeed = 0;

        this.mainGridRect = this.mainGridContainer.getBoundingClientRect();

        this.gridUpdatedCallbacks = [];

        this.addGridElement         = this.addGridElement.bind(this);
        this.removeGridElement      = this.removeGridElement.bind(this);
        this.getCells_NoAds         = this.getCells_NoAds.bind(this);
        this.coordContainsAnyAd     = this.coordContainsAnyAd.bind(this);
        this.findAdFreeBounds       = this.findAdFreeBounds.bind(this);

        this.tick                       = this.tick.bind(this);
        this.animateBossTransition_in   = this.animateBossTransition_in.bind(this);

        this.windowResized = this.windowResized.bind(this);
        GameManager.globalEventListener.addGlobalListener("resize", this.windowResized);
    }

    windowResized(e) {
        this.mainGridRect = this.mainGridContainer.getBoundingClientRect();
    }

    addGridElement(element, bounds) {
        element.layoutElement.style["grid-area"] = (bounds[0].y + 1) + " / " + (bounds[0].x + 1) + " / " + (bounds[1].y + 1) + " / " + (bounds[1].x + 1);

        for (let x = bounds[0].x; x < bounds[1].x; x++) {
            for (let y = bounds[0].y; y < bounds[1].y; y++) {
                this.gridArray[x][y].bindObject(element);
            }
        }

        for (let callback of this.gridUpdatedCallbacks) {
            callback();
        }
    }

    removeGridElement(element) {
        //element.layoutElement.remove();

        for (let x = element.gridBounds[0].x; x < element.gridBounds[1].x; x++) {
            for (let y = element.gridBounds[0].y; y < element.gridBounds[1].y; y++) {
                this.gridArray[x][y].unbindObject(element);
            }
        }

        for (let callback of this.gridUpdatedCallbacks) {
            callback();
        }
    }

    getCells_NoAds(excludeCoords) {
        let cellArray = [];

        for (let row of this.gridArray) {
            for (let cell of row) {
                if (cell.containsAnyAd()) continue;
                
                let shouldExclude = false;
                for (let coord of excludeCoords) {
                    if (cell.coord.equals(coord)) {
                        shouldExclude = true;
                        break;
                    }
                }
                if (shouldExclude) continue;

                cellArray.push(cell);
            }
        }

        return cellArray;
    }

    getCells_NoTools(excludeCoords) {
        let cellArray = [];

        for (let row of this.gridArray) {
            for (let cell of row) {
                if (cell.containsAnyTool()) continue;

                let shouldExclude = false;
                for (let coord of excludeCoords) {
                    if (cell.coord.equals(coord)) {
                        shouldExclude = true;
                        break;
                    }
                }
                if (shouldExclude) continue;

                cellArray.push(cell);
            }
        }

        return cellArray;
    }

    getCells_Empty() {
        let cellArray = [];

        for (let row of this.gridArray) {
            for (let cell of row) {
                if (cell.containsAnyObject()) continue;

                cellArray.push(cell);
            }
        }

        return cellArray;
    }

    coordContainsAnyAd(cellCoord) {
        let cell = this.gridArray[cellCoord[0]][cellCoord[1]];
        
        return cell.containsAnyAd();
    }

    findAdFreeBounds(targetSize, excludeCoords) {
        let boundsList = [];

        for (let xGrid = 0; xGrid < this.gridArray.length; xGrid++) {
            for (let yGrid = 0; yGrid < this.gridArray.length; yGrid++) {
                let boundsClear = true;

                if (xGrid + targetSize[0] > this.gridArray.length || yGrid + targetSize[1] > this.gridArray[xGrid].length) {
                    boundsClear = false;
                    continue;
                }

                if (boundsClear) {
                    for (let xSize = 0; xSize < targetSize[0]; xSize++) {
                        for (let ySize = 0; ySize < targetSize[1]; ySize++) {
                            let cell = this.gridArray[xGrid + xSize][yGrid + ySize];

                            for (let coord of excludeCoords) {
                                if (cell.coord.equals(coord)) {
                                    boundsClear = false;
                                    break;
                                }
                            }
                            if (cell.containsAnyAd()) {
                                boundsClear = false;
                                break;
                            }
                        }
                        if (!boundsClear) break;
                    }
                }   
                if (!boundsClear) {
                    continue;
                }
                
                boundsList.push([xGrid, yGrid, xGrid + targetSize[0], yGrid + targetSize[1]]);
            }
        }

        if (boundsList.length <= 0) boundsList = null;
        
        return boundsList;
    }

    getToolsInBounds(bounds) {
        let foundTools = [];

        for (let x = bounds[0].x; x < bounds[1].x; x++) {
            for (let y = bounds[0].y; y < bounds[1].y; y++) {
                for (let boundObject of this.gridArray[x][y].boundObjects) {
                    if (boundObject instanceof ToolGridElement && !foundTools.includes(boundObject)) {
                        foundTools.push(boundObject);
                    }
                }
            }
        }

        return foundTools;
    }

    animateBossTransition_in(adCover, startBounds, finishBounds, finishedCallback) {
        // animate last ad before moving it to the center
        adCover.stripInteractionButtons();
        adCover.layoutElement.classList.add("adTransformAnimation");
        adCover.unfreezeAd();
        adCover.setGrow(1);
        FunLib.removeFromArray(adCover.purgeCallbacks, GameManager.gridInitializer.adCoverage.purgeAd);
        adCover.finishAdPurging(true);
        adCover.freezeCallbacks = [];
        adCover.encryptCallback = null;
        adCover.freezeProtection = true;

        TimerManager.setTimer(3, function () {
            // continue boss spawn sequence after pre-animating the ad
            let start = [new Vector2(startBounds[0], startBounds[1]), new Vector2(startBounds[2], startBounds[3])];

            this.bossAnimationData = {
                adCover: adCover,
                direction: [],
                finishBounds: [new Vector2(finishBounds[0], finishBounds[1]), new Vector2(finishBounds[2], finishBounds[3])],
                currentBounds: [new Vector2(startBounds[0], startBounds[1]), new Vector2(startBounds[2], startBounds[3])],
                finishedCallback: finishedCallback
            }
            this.bossAnimationData.direction = [
                this.bossAnimationData.finishBounds[0].sub(start[0]),
                this.bossAnimationData.finishBounds[1].sub(start[1])
            ];
            this.bossAnimationData.totalDistance = [
                this.bossAnimationData.finishBounds[0].sub(this.bossAnimationData.currentBounds[0]).length(),
                this.bossAnimationData.finishBounds[1].sub(this.bossAnimationData.currentBounds[1]).length()
            ];

            adCover.layoutElement.classList.remove("adTransformAnimation");
            this.removeGridElement(adCover);
            adCover.layoutElement.remove();
            this.bossAnimationData.adCover.layoutElement.style["position"] = "absolute";
            this.mainGridContainerWrapper.append(adCover.layoutElement);
        }.bind(this));  
    }

    tick(deltaTime) {
        if (this.bossAnimationData == null) return;

        let finished = false;

        let distanceLeft = [
            this.bossAnimationData.finishBounds[0].distance(this.bossAnimationData.currentBounds[0]), 
            this.bossAnimationData.finishBounds[1].distance(this.bossAnimationData.currentBounds[1])
        ];

        // speed
        let avgDistanceLeft = (distanceLeft[0] + distanceLeft[1]) / 2;
        let avgTotalDistance = (this.bossAnimationData.totalDistance[0] + this.bossAnimationData.totalDistance[1]) / 2;

        if (avgTotalDistance - avgDistanceLeft < this.lengthLimit) {
            this.gridInterpolationSpeed = FunLib.clamp((avgTotalDistance - avgDistanceLeft) / this.lengthLimit, 0.05, 1) * this.maxGridInterpolationSpeed;
        }
        else if (avgDistanceLeft < this.lengthLimit) {
            this.gridInterpolationSpeed = FunLib.clamp(avgDistanceLeft / this.lengthLimit, 0.05, 1.0) * this.maxGridInterpolationSpeed;
        }
        else {
            this.gridInterpolationSpeed = this.maxGridInterpolationSpeed;
        }

        // moving
        if (distanceLeft[0] <= deltaTime * this.gridInterpolationSpeed * this.bossAnimationData.direction[0].length()
            && distanceLeft[1] <= deltaTime * this.gridInterpolationSpeed * this.bossAnimationData.direction[1].length()) {

            this.bossAnimationData.currentBounds = [
                new Vector2(this.bossAnimationData.finishBounds[0].x, this.bossAnimationData.finishBounds[0].y), 
                new Vector2(this.bossAnimationData.finishBounds[1].x, this.bossAnimationData.finishBounds[1].y)
            ];
            finished = true;
        }
        else {
            let vec1 = this.bossAnimationData.direction[0].mult_num(deltaTime * this.gridInterpolationSpeed);
            let vec2 = this.bossAnimationData.direction[1].mult_num(deltaTime * this.gridInterpolationSpeed);
            this.bossAnimationData.currentBounds[0] = this.bossAnimationData.currentBounds[0].add(vec1);
            this.bossAnimationData.currentBounds[1] = this.bossAnimationData.currentBounds[1].add(vec2);
        }

        let gridRect = this.mainGridRect;
        
        let gridCellSize = [gridRect.width / 9, gridRect.height / 9];
        let cornerPositions = [
            this.bossAnimationData.currentBounds[0].x * gridCellSize[0],
            this.bossAnimationData.currentBounds[0].y * gridCellSize[1],
            this.bossAnimationData.currentBounds[1].x * gridCellSize[0],
            this.bossAnimationData.currentBounds[1].y * gridCellSize[1],
        ];

        let width = (cornerPositions[2] - cornerPositions[0]);
        let height = (cornerPositions[3] - cornerPositions[1]);
        this.bossAnimationData.adCover.layoutElement.style["left"] = cornerPositions[0] + "px";
        this.bossAnimationData.adCover.layoutElement.style["top"] = cornerPositions[1] + "px";
        this.bossAnimationData.adCover.layoutElement.style["width"] = width + "px";
        this.bossAnimationData.adCover.layoutElement.style["height"] = height + "px";

        let img = this.bossAnimationData.adCover.adCoverImg;
        let border = this.bossAnimationData.adCover.initialBorderWidth * 2;
        img.width = width - border + "px";
        img.height = height - border + "px";
        img.style["width"] = width - border+ "px";
        img.style["height"] = height - border + "px";

        if (finished) {
            GameManager.gridInitializer.adCoverage.removeAd(this.bossAnimationData.adCover);
            this.bossAnimationData.finishedCallback();
            this.bossAnimationData = null;
        }
    }
}