//
// InputHandler
//
class InputHandler {

    constructor(inputDiv, inputSuccededCallback) {
        this.inputDiv = null;
        this.inputSuccededCallback = null;
        this.customInputElement = null;

        this.autoClickPromptDelay = 0.2;
        this.autoClickEnabled = false;
        this.autoClickSpeed = 6;
        this.autoClickCurrentDelay = 0;
        this.isAutoClickConfirmed = false;
        this.autoClickPromptHandle = new TimerHandle(-1);
        this.autoClickRing = null;
        this.autoClickSupported = true;

        this.inputSucceded          = this.inputSucceded.bind(this);
        this.setupInput             = this.setupInput.bind(this);
        this.deactivate             = this.deactivate.bind(this);
        this.tick                   = this.tick.bind(this);
        this.setAutoClickEnabled    = this.setAutoClickEnabled.bind(this);
        this.startAutoClick         = this.startAutoClick.bind(this);
        this.stopAutoClick          = this.stopAutoClick.bind(this);
        this.autoClickSucceeded     = this.autoClickSucceeded.bind(this);
    }
    
    setupInput(inputDiv, inputSuccededCallback) {
        this.inputDiv = inputDiv;
        this.inputSuccededCallback = inputSuccededCallback;

        this.inputDiv.innerHTML = "";
        if (this.customInputElement != null && this.inputDiv.contains(this.customInputElement) === false) {
            this.inputDiv.appendChild(this.customInputElement);
        }

        this.inputDiv.addEventListener("mousedown", this.startAutoClick);
        this.inputDiv.addEventListener("mouseup", this.stopAutoClick);
        this.inputDiv.addEventListener("mouseleave", this.stopAutoClick);

    }

    deactivate() {
        if (this.customInputElement != null && this.inputDiv.contains(this.customInputElement) === true) {
            this.inputDiv.removeChild(this.customInputElement);
        }

        this.inputDiv = null;
        this.inputSuccededCallback = null;
    }

    inputSucceded() {
        this.inputSuccededCallback(1.0);
    }

    tick(deltaTime) {
        if (this.isAutoClickAvailable() && this.isAutoClickConfirmed === true) {
            this.autoClickCurrentDelay += deltaTime;
            if (this.autoClickCurrentDelay >= 1 / this.autoClickSpeed) {
                this.autoClickCurrentDelay = 0;
                this.autoClickSucceeded();
            }
        }
    }

    isAutoClickAvailable() {
        return this.autoClickEnabled === true && this.autoClickSupported === true;
    }
    setAutoClickEnabled(state) {
        this.autoClickEnabled = state;
    }
    startAutoClick(e) {
        if (!this.isAutoClickAvailable()) return;

        TimerManager.removeTimer(this.autoClickPromptHandle);
        this.autoClickRing = GlobalAnimations.animateProgressRing(this.autoClickPromptDelay, new Vector2(e.clientX, e.clientY));

        this.autoClickPromptHandle = TimerManager.setTimer(this.autoClickPromptDelay, function () { 
            this.isAutoClickConfirmed = true; 
            GlobalAnimations.stopProgressRing(this.autoClickRing);
        }.bind(this));
    }
    stopAutoClick(e) {
        TimerManager.removeTimer(this.autoClickPromptHandle);
        this.isAutoClickConfirmed = false;
        GlobalAnimations.stopProgressRing(this.autoClickRing);
    }
    autoClickSucceeded() {
        this.inputSucceded();
    }
}

//
// ClickInputHandler
//
class ClickInputHandler extends InputHandler {
    
    constructor() {
        super();
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);
        
        this.inputDiv.addEventListener("click", this.inputSucceded);
    }

    deactivate() {
        this.inputDiv.removeEventListener("click", this.inputSucceded);

        super.deactivate();
    }
}

//
// DoubleClickInputHandler
//
class DoubleClickInputHandler extends InputHandler {

    constructor() {
        super();

        this.currentPendingClicks = 0;
        this.clickInvalidTimerHandle = null;
        this.clickInvalidDelay = 0.5;

        this.invalidateClicks   = this.invalidateClicks.bind(this);
        this.singleClick        = this.singleClick.bind(this);
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);
        this.inputDiv.addEventListener("click", this.singleClick);
    }

    deactivate() {
        this.inputDiv.removeEventListener("click", this.singleClick);
        super.deactivate();
    }



    invalidateClicks() {
        this.currentPendingClicks = 0;
    }

    singleClick() {
        if (this.currentPendingClicks >= 1) {
            this.currentPendingClicks = 0;
            TimerManager.removeTimer(this.clickInvalidTimerHandle);
            this.inputSucceded();
            return;
        }

        this.currentPendingClicks++;
        this.clickInvalidTimerHandle = TimerManager.setTimer(this.clickInvalidDelay, this.invalidateClicks);
    }
}

//
// HoldInputHandler
//
class HoldInputHandler extends InputHandler {

    constructor() {
        super();

        this.holdSuccessTime = 0.25;
        this.holdTimerHandle = new TimerHandle(-1);

        this.startHold          = this.startHold.bind(this);
        this.holdSucceeded      = this.holdSucceeded.bind(this);
        this.interruptHold      = this.interruptHold.bind(this);
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);

        this.inputDiv.addEventListener("mousedown", this.startHold);
        this.inputDiv.addEventListener("mouseup", this.interruptHold);
        this.inputDiv.addEventListener("mouseleave", this.interruptHold);
    }

    deactivate() {
        this.inputDiv.removeEventListener("mousedown", this.startHold);
        this.inputDiv.removeEventListener("mouseup", this.interruptHold);
        this.inputDiv.removeEventListener("mouseleave", this.interruptHold);
        TimerManager.removeTimer(this.holdTimerHandle);

        super.deactivate();
    }



    startHold() {
        this.holdTimerHandle = TimerManager.setTimer(this.holdSuccessTime, this.holdSucceeded);
    }

    holdSucceeded() {
        TimerManager.removeTimer(this.holdTimerHandle);
        this.inputSucceded();
        this.startHold();
    }

    interruptHold() {
        TimerManager.removeTimer(this.holdTimerHandle);
    }
}

//
// AutoInputHandler
//
class AutoInputHandler extends InputHandler {

    constructor() {
        super();

        this.autoSuccessTime = 1;
        this.autoTimerHandle = new TimerHandle(-1);

        this.startAuto      = this.startAuto.bind(this);
        this.autoSucceeded  = this.autoSucceeded.bind(this);
        this.interruptAuto  = this.interruptAuto.bind(this);
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);

        this.startAuto();
    }

    deactivate() {
        TimerManager.removeTimer(this.autoTimerHandle);
        super.deactivate();
    }



    startAuto() {
        this.autoTimerHandle = TimerManager.setTimer(this.autoSuccessTime, this.autoSucceeded);
    }

    autoSucceeded() {
        TimerManager.removeTimer(this.autoTimerHandle);
        this.inputSucceded();
        this.startAuto();
    }

    interruptAuto() {
        TimerManager.removeTimer(this.autoTimerHandle);
    }
}

//
// RecognizerInputHandler
//
class RecognizerInputHandler extends InputHandler {

    constructor(gestures, continuousTracking, gestureRecognizedCallback, recognizeTreshold) {
        super();

        this.drawingContext = null;
        this.canvas = null;

        this.currentX = 0;
        this.currentY = 0;
        this.lastX = 0;
        this.lastY = 0;

        this.gestureRecognizer = new DollarRecognizer();
        for (let gestureName of gestures) {
            this.gestureRecognizer.unlockUnistroke(gestureName);
        }

        if (gestureRecognizedCallback !== undefined) {
            this.gestureRecognizedCallback = gestureRecognizedCallback;
        }
        else {
            this.gestureRecognizedCallback = null;
        }

        if (continuousTracking === true || continuousTracking === false) {
            this.continuousTracking = continuousTracking;
        }
        else {
            this.continuousTracking = false;
        }

        this.isGestureTracked = false;
        this.recordedPoints = [];
        this.recognizeTimePassed = 0.0;

        this.recognizeTreshold = 0.6;
        if (this.recognizeTreshold != undefined && this.recognizeTreshold != null) {
            this.recognizeTreshold = recognizeTreshold;
        }
        
        this.recognizeFrequency = 0.1;
        this.minimumTrackingDistance = 3;

        this.visualizeColor = "rgb(120, 80, 240)";
        this.visualizeLineWidth = 4;

        this.resetGestureTracking   = this.resetGestureTracking.bind(this);
        this.startGestureTracking   = this.startGestureTracking.bind(this);
        this.updateGestureTracking  = this.updateGestureTracking.bind(this);
        this.stopGestureTracking    = this.stopGestureTracking.bind(this);
        this.updateCoordsToMouse    = this.updateCoordsToMouse.bind(this);
        this.visualize              = this.visualize.bind(this);
        this.recognizeGesture       = this.recognizeGesture.bind(this);
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);

        let padding = parseFloat(window.getComputedStyle(inputDiv, null).getPropertyValue('padding-left'));
        let paddingParent = parseFloat(window.getComputedStyle(inputDiv.parentNode, null).getPropertyValue('padding-left'));

        this.canvas = document.createElement("canvas");
        this.canvas.id = "inputCanvas";
        let inputRect = this.inputDiv.getBoundingClientRect();

        this.canvas.width = inputRect.width - padding * 2;
        this.canvas.height = inputRect.height - padding * 2;
        this.canvas.style["width"] = this.canvas.width + "px";
        this.canvas.style["height"] = this.canvas.height + "px";
        this.canvas.style["top"] = padding + paddingParent + "px";
        
        this.inputDiv.appendChild(this.canvas);
        this.drawingContext = this.canvas.getContext("2d");

        this.canvas.addEventListener("mousedown", this.startGestureTracking, false);
        this.canvas.addEventListener("mousemove", this.updateGestureTracking, false);
        this.canvas.parentNode.parentNode.addEventListener("mouseup", this.stopGestureTracking, false);
        this.canvas.parentNode.parentNode.addEventListener("mouseleave", this.stopGestureTracking, false);
    }

    deactivate() {
        this.canvas.removeEventListener("mousedown", this.startGestureTracking);
        this.canvas.removeEventListener("mousemove", this.updateGestureTracking);
        this.canvas.parentNode.parentNode.removeEventListener("mouseup", this.stopGestureTracking);
        this.canvas.parentNode.parentNode.removeEventListener("mouseleave", this.stopGestureTracking);

        this.stopGestureTracking();

        this.inputDiv.removeChild(this.canvas);
        this.canvas = null;
        this.drawingContext = null;
        
        super.deactivate();
    }

    tick(deltaTime) {
        if (this.continuousTracking === false) return;

        // Continuous tracking
        this.recognizeTimePassed += deltaTime;
        if (this.recognizeTimePassed < this.recognizeFrequency) return;
        if (this.gestureRecognizer == null) return;

        this.recognizeTimePassed += 0.0;
        this.recognizeGesture();
    }



    resetGestureTracking(retainPositions) {
        if (retainPositions !== true) {
            this.currentX = 0;
            this.currentY = 0;
            this.lastX = 0;
            this.lastY = 0;
        }
        
        this.recordedPoints = [];
        this.recognizeTimePassed = 0.0;

        this.drawingContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    startGestureTracking(e) {
        this.isGestureTracked = true;
        this.updateCoordsToMouse(e, true);
        this.visualize();
    }

    updateGestureTracking(e) {
        if (this.updateCoordsToMouse(e, false) === false) return;
        if (this.isGestureTracked === false) return;

        this.recordedPoints.push(new Point(this.currentX, this.currentY));
        this.visualize();
    }

    stopGestureTracking(e) {
        if (this.isGestureTracked === false) return;
        this.isGestureTracked = false;

        if (this.continuousTracking === false) {
            this.recognizeGesture();
        }
        this.resetGestureTracking(false);
    }

    updateCoordsToMouse(e, isStartingPoint) {
        let newX = e.offsetX; // e.clientX - this.canvas.offsetLeft;
        let newY = e.offsetY; //e.clientY - this.canvas.offsetTop;

        if (isStartingPoint === false) {
            let distanceX = newX - this.currentX;
            let distanceY = newY - this.currentY;
            let totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (totalDistance < this.minimumTrackingDistance) return false;
        }

        this.lastX = this.currentX;
        this.lastY = this.currentY;
        this.currentX = newX;
        this.currentY = newY;

        return true;
    }

    visualize() {
        this.drawingContext.beginPath();
        this.drawingContext.strokeStyle = this.visualizeColor;
        this.drawingContext.lineWidth = this.visualizeLineWidth;
        this.drawingContext.lineCap = 'round';
        this.drawingContext.lineJoin = 'round';
        this.drawingContext.moveTo(this.lastX, this.lastY);
        this.drawingContext.lineTo(this.currentX, this.currentY);
        this.drawingContext.stroke();
        this.drawingContext.closePath();
    }

    recognizeGesture() {
        let recognizeResult = this.gestureRecognizer.Recognize(this.recordedPoints, false);

        if (recognizeResult.Score >= this.recognizeTreshold) {
            this.resetGestureTracking(true);

            if (this.gestureRecognizedCallback != null) {
                this.gestureRecognizedCallback(recognizeResult);
            }

            this.inputSucceded();
        }
    }
}

//
// BicycleInputHandler
//
class BicycleInputHandler extends InputHandler {

    constructor() {
        super();

        this.possibleClickSides = [0, 2];
        this.currentClickSide = NaN;
        
        this.singleClick            = this.singleClick.bind(this);
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);

        this.currentClickSide = NaN;
        this.inputDiv.addEventListener("mouseup", this.singleClick);
    }

    deactivate() {
        this.inputDiv.removeEventListener("mouseup", this.singleClick);
        super.deactivate();
    }


    singleClick(e) {
        let newClickSide = e.button;

        if (this.currentClickSide === newClickSide
            || !this.possibleClickSides.includes(newClickSide)) {
            this.inputSuccededCallback(-1.0);
            return;
        }
        
        this.currentClickSide = newClickSide;
        this.inputSuccededCallback(1.0);
    }
}

//
// ButtonsInputHandler
//
class ButtonsInputHandler extends InputHandler {

    constructor() {
        super();

        //this.possibleClickSides = [0, 2];

        this.singleClick = this.singleClick.bind(this);
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);
        this.inputDiv.addEventListener("mouseup", this.singleClick);
    }

    deactivate() {
        this.inputDiv.removeEventListener("mouseup", this.singleClick);
        super.deactivate();
    }


    singleClick(e) {
        this.inputSuccededCallback(e.button);
    }
}

//
// MenuListHandler
//
class MenuListHandler extends InputHandler {

    constructor() {
        super();
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);

        //this.inputDiv.addEventListener("click", this.inputSucceded);
    }

    deactivate() {
        //this.inputDiv.removeEventListener("click", this.inputSucceded);

        super.deactivate();
    }
}




//
// CrankInputHandler
//
class CrankInputHandler extends InputHandler {

    constructor(sizeFraction, spinSuccessfulCallback) {
        super();

        this.sizeFraction = sizeFraction;

        if (spinSuccessfulCallback !== undefined) {
            this.spinSuccessfulCallback = spinSuccessfulCallback;
        }
        else {
            this.spinSuccessfulCallback = null;
        }

        this.crankCenter = null;

        this.crankElement = null;
        this.container = null;
        this.counter = null
        this.strengthContainer = null;

        this.originRotation = -45;
        this.rotateDirection = 1;
        this.measuredDelta = 0;
        this.accumulatedSpeed = 0;
        this.spinDampening = 20;
        this.measurementDuration = 0;
        this.spinProgress = 0;
        this.angleSnapshot = 0;

        this.grabbedRotation = 0;
        this.currentAngle = 0;
        this.isMeasuring = false;

        this.currentStrength = 0;
        this.strengthDirection = 1;
        this.strengthGrowSpeed = 1;
        this.maxStrengthGrowSpeed = 4;
        this.updateStrength = false;
        this.accessibilityStrengthTreshold = 0.85;

        this.minStrengthColor = [255, 15, 15];
        this.maxStrengthColor = [100, 200, 50];

        this.boostLocked = false;

        this.isHovered = false;

        this.canPlayerSpin = true;
        this.playerSpinSucceededCallback = null;
        this.accumulatedSpeedUpdatedCallback = null;
        this.strengthUpdatedCallback = null;

        this.boostSpin              = this.boostSpin.bind(this);
        this.startSpinMeasurement   = this.startSpinMeasurement.bind(this);
        this.measureSpin            = this.measureSpin.bind(this);
        this.finishSpinMeasurement  = this.finishSpinMeasurement.bind(this);
        this.getAngleFromMouse      = this.getAngleFromMouse.bind(this);
        this.setCrankRotation       = this.setCrankRotation.bind(this);
        this.getRotationDelta       = this.getRotationDelta.bind(this);
        this.startHover             = this.startHover.bind(this);
        this.endHover               = this.endHover.bind(this);

        this.windowResized = this.windowResized.bind(this);
    }

    setupInput(inputDiv, inputSuccededCallback) {
        super.setupInput(inputDiv, inputSuccededCallback);

        this.container = document.createElement("div");
        this.container.classList.add("crankInputHandler_container");

        this.counter = document.createElement("div");
        this.counter.classList.add("crankInputHandler_counter");
        this.counter.style["width"] = (this.sizeFraction * 100) + "%";
        this.counter.style["height"] = (this.sizeFraction * 100) + "%";

        this.crankElement = document.createElement("div");
        this.crankElement.classList.add("crankInputHandler_crank");
        this.crankElement.style["transform"] = "rotate(" + this.originRotation + "deg)";

        let coolerImg = document.createElement("img");
        coolerImg.classList.add("crankInputHandler_coolerImg");
        coolerImg.src = "img/cooler.png";

        let resourceImg = document.createElement("img");
        resourceImg.classList.add("crankInputHandler_resourceImg");
        resourceImg.src = "svg/firecracker.svg";
        resourceImg.alt = "firecracker";

        let crankPointer = document.createElement("div");
        crankPointer.classList.add("crankInputHandler_pointer");

        this.strengthContainer = document.createElement("div");
        this.strengthContainer.classList.add("crankInputHandler_strengthContainer");

        for (let index = 0; index < 4; index++) {
            let strengthArrow = document.createElement("div");

            strengthArrow.classList.add("crankInputHandler_strengthArrow");
            if (index < 2) {
                strengthArrow.classList.add("crankInputHandler_strengthArrow_short");
            }
            
            this.strengthContainer.append(strengthArrow);
        }
        
        this.crankElement.appendChild(crankPointer);
        this.crankElement.append(coolerImg);
        this.counter.append(this.strengthContainer, this.crankElement);
        this.container.append(this.counter);
        this.inputDiv.appendChild(this.container);

        this.container.addEventListener("click", this.boostSpin, false);
        this.container.addEventListener("mouseenter", this.startHover, false);
        this.container.addEventListener("mouseleave", this.endHover, false);
        // this.container.addEventListener("mousedown", this.startSpinMeasurement, false);
        // document.addEventListener("mousemove", this.measureSpin, false);
        // document.addEventListener("mouseup", this.finishSpinMeasurement, false);

        document.addEventListener('keydown', function (e) {
            if (e.key == "Escape" && this.crankElement != null) {
                this.finishSpinMeasurement();
            }
        }.bind(this));

        GameManager.globalEventListener.addGlobalListener("resize", this.windowResized);

        this.recalcSizeVariables();
        this.setUpdateStrength(false);
    }

    deactivate() {
        GameManager.globalEventListener.removeGlobalListener("resize", this.windowResized);

        this.container.removeEventListener("click", this.boostSpin, false);
        this.container.removeEventListener("mouseenter", this.setHoveredTrue, false);
        this.container.removeEventListener("mouseleave", this.setHoveredFalse, false);
        // this.container.removeEventListener("mousedown", this.startSpinMeasurement);
        // document.removeEventListener("mousemove", this.measureSpin);
        // document.removeEventListener("mouseup", this.finishSpinMeasurement);

        this.resetSpin();
        this.crankElement = null;
        this.container = null;

        super.deactivate();
    }

    tick(deltaTime) {
        // if (this.isMeasuring === true) {
        //     this.measurementDuration += deltaTime;
        // }
        //else 

        if (this.updateStrength === true) {
            let disableStrengthUpdates = false;

            this.currentStrength += FunLib.lerpNumber(this.currentStrength, this.strengthGrowSpeed, this.maxStrengthGrowSpeed) * this.strengthDirection * deltaTime;
            if (this.strengthUpdatedCallback != null && this.strengthUpdatedCallback != undefined && this.boostLocked === false) {
                this.strengthUpdatedCallback(this.currentStrength >= 0.9 ? 1 : this.currentStrength);
            }

            if (this.currentStrength > 1) {
                this.strengthDirection = -1;
                this.currentStrength = 1;
            }
            else if (this.currentStrength < 0) {
                this.strengthDirection = 1;
                this.currentStrength = 0;

                this.boostLocked = false;
                disableStrengthUpdates = true;
                this.strengthUpdatedCallback(-1);
            }
            let strengthColor = FunLib.getColorString(FunLib.lerpColor(this.currentStrength, this.minStrengthColor, this.maxStrengthColor));

            let arrowDirection = 1;
            for (let i = 0; i < this.strengthContainer.childNodes.length; i++) {
                let strengthArrow = this.strengthContainer.childNodes[i];

                if (i > 1) {
                    strengthArrow.style["transform"] = "rotate(" + this.currentStrength * 180 * arrowDirection + "deg)";
                    strengthArrow.style["background-color"] = strengthColor;
                }
                else if (this.boostLocked === false && disableStrengthUpdates === false) {
                    strengthArrow.style["transform"] = "rotate(" + (this.currentStrength >= 0.9 ? 1 : this.currentStrength) * 180 * arrowDirection + "deg)";
                    strengthArrow.style["background-color"] = strengthColor;
                    strengthArrow.classList.remove("hidden_fade");
                }
                else {
                    strengthArrow.classList.add("hidden_fade");
                }

                if (arrowDirection === 1) {
                    arrowDirection = -1;
                }
                else {
                    arrowDirection = 1;
                }
            }
            this.counter.style["border-color"] = strengthColor;
            this.counter.style["box-shadow"] = "0 0 " + this.currentStrength * 20 + "px " + strengthColor + ", 0 0 " + this.currentStrength * 15 + "px " + strengthColor + ", 0 0 " + this.currentStrength * 10 + "px " + strengthColor;

            if (disableStrengthUpdates === true) {
                this.setUpdateStrength(false);
            }
        }
        

        if (this.accumulatedSpeed > 0) {
            let speed = this.accumulatedSpeed / this.measurementDuration * deltaTime;
            let calcDamp = this.spinDampening * deltaTime;

            this.accumulatedSpeed = FunLib.clamp(this.accumulatedSpeed - calcDamp, 0 , this.accumulatedSpeed);
            if (this.accumulatedSpeedUpdatedCallback != null) {
                this.accumulatedSpeedUpdatedCallback(this.accumulatedSpeed / this.measurementDuration / 360 * 60);
            }

            this.spinProgress += speed;
            this.currentAngle = this.clampAngle(this.currentAngle + (speed * this.rotateDirection));

            if (this.spinProgress >= 360) {
                this.inputSucceded();
                this.spinProgress = 0;
            }

            this.setCrankRotation(this.currentAngle);
        }

        if (this.isAutoClickAvailable() && this.isAutoClickConfirmed === true) {
            if (this.currentStrength >= this.accessibilityStrengthTreshold) {
                this.boostSpin();
            }
        }
    }

    autoClickSucceeded() {
    }

    inputSucceded() {
        this.crankElement.classList.remove("succeeded");
        void this.crankElement.offsetHeight;
        this.crankElement.classList.add("succeeded");
        super.inputSucceded();
    }

    windowResized(e) {
        if (this.inpuDiv == null || this.inputDiv == undefined) return;

        this.recalcSizeVariables();
    }

    recalcSizeVariables() {
        let containerRect = this.container.getBoundingClientRect();
        this.crankCenter = new Vector2(
            containerRect.x + this.container.offsetLeft + (this.container.offsetWidth) / 2,
            containerRect.y + this.container.offsetTop + (this.container.offsetHeight) / 2
        );

        let inputRect = this.inputDiv.getBoundingClientRect();
    }

    startHover() {
        this.isHovered = true;
        this.setUpdateStrength(true);
    }
    endHover() {
        this.isHovered = false;
    }

    boostSpin(e) {
        if (this.canPlayerSpin === false) return;
        if (this.boostLocked === true) return;

        let usedStrength = this.currentStrength >= 0.9 ? 1 : this.currentStrength;
        this.rotateDirection = 1;
        this.accumulatedSpeed += 90 * usedStrength;
        this.measurementDuration = 0.1;

        if (this.playerSpinSucceededCallback != null) {
            this.playerSpinSucceededCallback();
        }

        this.boostLocked = true;
    }
    startSpinMeasurement(e) {
        if (this.canPlayerSpin === false) return;

        this.isMeasuring  = true;
        this.grabbedRotation = this.getAngleFromMouse(e, this.crankCenter);
        this.angleSnapshot = this.currentAngle;
        //this.currentAngle = this.grabbedRotation;
        this.measurementDuration = 0;
    }
    measureSpin(e) {
        if (this.canPlayerSpin === false) return;
        if (this.isMeasuring === false) return;

        let angle = 0;
        angle = this.getAngleFromMouse(e, this.crankCenter);

        let deltaAngle = this.getRotationDelta(this.grabbedRotation, angle);
        if (deltaAngle === 0) {
            return;
        }

        let newDirection = Math.sign(deltaAngle);
        if (this.rotateDirection != newDirection) {
            this.measuredDelta = 0;
            this.rotateDirection = newDirection;

            this.accumulatedSpeed = 0;
            if (this.accumulatedSpeedUpdatedCallback != null) {
                this.accumulatedSpeedUpdatedCallback(this.accumulatedSpeed);
            }
        }

        let newAngle = this.clampAngle(this.angleSnapshot + deltaAngle);

        this.spinProgress += Math.abs(deltaAngle);
        this.measuredDelta += Math.abs(deltaAngle);
        this.setCrankRotation(newAngle);
        this.currentAngle = newAngle;
    }
    finishSpinMeasurement(e) {
        if (this.isMeasuring === false) return;
        this.interruptSpinMeasurement();

        if (this.measuredDelta > 0) {
            this.accumulatedSpeed += this.measuredDelta / 360 / (this.measurementDuration > 0 ? this.measurementDuration : 0.000001);
            if (this.accumulatedSpeedUpdatedCallback != null) {
                this.accumulatedSpeedUpdatedCallback(this.accumulatedSpeed);
            }

            if (this.playerSpinSucceededCallback != null) {
                this.playerSpinSucceededCallback();
            }
        }
        else {
            this.accumulatedSpeed = 0;
            if (this.accumulatedSpeedUpdatedCallback != null) {
                this.accumulatedSpeedUpdatedCallback(this.accumulatedSpeed);
            }
        }

        this.measuredDelta = 0;
    }
    interruptSpinMeasurement() {
        this.isMeasuring = false;
        this.grabbedRotation = 0;
    }
    resetSpin() {
        this.isMeasuring = false;
        this.grabbedRotation = 0
        this.accumulatedSpeed = 0;
        this.currentAngle = 0;
        this.spinProgress = 0;
        this.setCrankRotation(0);
    }

    getAngleFromMouse(e, center) {
        let position = new Vector2(e.clientX, e.clientY);
        let direction = position.sub(center);
        direction = direction.normalize();
        let angle = Math.atan2(direction.y, direction.x) * 180 / Math.PI + 90;

        return angle;
    }
    getRotationDelta(lastAngle, nextAngle) {
        let deltaAngle = nextAngle - lastAngle;

        // Filters out most errors related to high-fps position deltas calculation
        if (Math.abs(deltaAngle) < 1) return 0;

        return this.clampAngle(deltaAngle);
    }
    clampAngle(angle) {
        if (angle > -180 && angle <= 180) {
            return angle;
        }
        else if (angle > 180) {
            return angle - 360;
        }
        else if (angle <= -180) {
            return angle + 360;
        }
    }
    setCrankRotation(angle) {
        this.crankElement.style["transform"] = "rotate(" + (this.originRotation + angle) + "deg)";
    }

    setCanPlayerSpin(state) {
        this.canPlayerSpin = state;
        if (this.canPlayerSpin === false) {
            this.interruptSpinMeasurement();
        }

        this.setUpdateStrength(true);
    }

    setUpdateStrength(state) {
        if (state === false) {
            if (this.canPlayerSpin === false || this.isHovered === false) {
                this.updateStrength = false;

                for (let i = 2; i < 4; i++) {
                    let strengthArrow = this.strengthContainer.childNodes[i];
                    strengthArrow.classList.add("strengthDisabled"); //style["background-color"] = "gray";
                }
                this.counter.classList.add("strengthDisabled"); //style["border-color"] = "gray";
            }
        }
        else if (this.canPlayerSpin === true && this.isHovered === true) {
            this.updateStrength = true;

            for (let i = 2; i < 4; i++) {
                let strengthArrow = this.strengthContainer.childNodes[i];
                strengthArrow.classList.remove("strengthDisabled"); //style["background-color"] = "gray";
            }
            this.counter.classList.remove("strengthDisabled"); //style["border-color"] = "gray";
        }
    }
}