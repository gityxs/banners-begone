class ResourceSlider extends HTMLElement  {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.resourceId = null;
        this.inputDisabled = false;

        this.linkElem = document.createElement('link');
        this.linkElem.setAttribute('rel', 'stylesheet');
        this.linkElem.setAttribute('href', 'css/customSlider.css');

        this.customSlider_container = document.createElement("div");
        this.customSlider_container.classList.add("customSlider_container");

        this.customSlider_track_container = document.createElement("div");
        this.customSlider_track_container.classList.add("customSlider_track_container");

        this.customSlider_thumb_container = document.createElement("div");
        this.customSlider_thumb_container.classList.add("customSlider_thumb_container");

        this.customSlider_track = document.createElement("div");
        this.customSlider_track.classList.add("customSlider_track");
        
        this.customSlider_thumb = document.createElement("div");
        this.customSlider_thumb.classList.add("customSlider_thumb");

        this.customSlider_thumb_p = document.createElement("p");
        this.customSlider_thumb_p.classList.add("customSlider_thumb_p");

        this.customSlider_valueDisplay_p = document.createElement("p");
        this.customSlider_valueDisplay_p.classList.add("customSlider_valueDisplay_p");

        this.thumbRect = null;
        this.trackRect = null;

        this.windowResized = this.windowResized.bind(this);

        this.isInitialized = false;
    }

    windowResized(e) {
        this.thumbRect = this.customSlider_thumb.getBoundingClientRect();
        this.trackRect = this.customSlider_track.getBoundingClientRect();
        this.updateInputProgress();
    }

    updateBoundingRects() {
        if (this.isInitialized === true) return;

        this.thumbRect = this.customSlider_thumb.getBoundingClientRect();
        this.trackRect = this.customSlider_track.getBoundingClientRect();
    }

    connectedCallback() {
        this.disconnectedCallback();
        GameManager.globalEventListener.addGlobalListener("resize", this.windowResized);
        
        this.customSlider_container.addEventListener("mousedown", function (e) { if (!this.inputDisabled) { this.updateThumbInputState(e, "start"); }}.bind(this));
        this.customSlider_container.addEventListener("mouseup", function (e) { if (!this.inputDisabled) { this.updateThumbInputState(e, "end"); }}.bind(this));
        document.addEventListener("mouseup", function (e) { if (!this.inputDisabled) { this.updateThumbInputState(e,"end"); }}.bind(this));
        document.addEventListener("mousemove", function (e) { if (!this.inputDisabled) { this.updateThumbInputState(e, "update"); }}.bind(this));


        this.customSlider_thumb.append(this.customSlider_thumb_p, this.customSlider_valueDisplay_p);
        this.customSlider_track_container.append(this.customSlider_track);
        this.customSlider_thumb_container.append(this.customSlider_thumb);
        this.customSlider_container.append(this.customSlider_track_container, this.customSlider_thumb_container);
        this.shadowRoot.append(this.linkElem, this.customSlider_container);

        // Value change observer
        const config = { attributes: true };
        const callback = function (mutationsList, observer) {
            
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    switch (mutation.attributeName) {
                        case "value":
                            this.updateInputProgress();
                    }
                }
            }
        }.bind(this);
        const observer = new MutationObserver(callback);
        observer.observe(this, config);


        if (!this.hasAttribute("min")) {
            this.setAttribute("min", -1);
        }
        if (!this.hasAttribute("max")) {
            this.setAttribute("max", 1);
        }
        if (!this.hasAttribute("value")) {
            let min = parseFloat(this.getAttribute("min"));
            let max = parseFloat(this.getAttribute("max"));
            this.setAttribute("value", Math.round(FunLib.lerpNumber(0.5, min, max)));
        }
    }
    disconnectedCallback() {
        this.shadowRoot.textContent = "";
        GameManager.globalEventListener.removeGlobalListener("resize", this.windowResized);
    }


    updateThumbPosition(e) {
        this.updateBoundingRects();

        let mousePos = new Vector2(e.clientX, e.clientY);
        let maxPx = this.trackRect.width - this.thumbRect.width;
        let valuePx = FunLib.clamp(mousePos.x - this.trackRect.x - this.thumbRect.width / 2, 0, maxPx);
        let value = valuePx / maxPx;

        if (valuePx > maxPx * 0.5 - 1 
            && valuePx < maxPx * 0.5 + 1 ) {
            value = 0.5;
        }

        let max = parseFloat(this.getAttribute("max"));
        let min = parseFloat(this.getAttribute("min"));
        value = Math.round(FunLib.lerpNumber(value, min, max));
        value = FunLib.clamp(value, min, max);

        this.setValue(value);
    }

    updateThumbInputState(e, state) {
        this.updateBoundingRects();

        let thumb = this.customSlider_thumb;
        let prevState = thumb.getAttribute("custom_slider_thumbstate");

        if ((prevState == "start" && state == "update")) {
            this.updateThumbPosition(e);
        }
        else if (prevState == "start" && state == "end") {
            this.updateThumbPosition(e);
            thumb.setAttribute("custom_slider_thumbstate", state);
        }
        else {
            thumb.setAttribute("custom_slider_thumbstate", state);
        }
    }

    updateInputProgress() {
        this.updateBoundingRects();

        let value = parseFloat(this.getAttribute("value"));
        let max = parseFloat(this.getAttribute("max"));
        let min = parseFloat(this.getAttribute("min"));
        value = FunLib.clamp(value, min, max);

        let maxPx = this.trackRect.width - this.thumbRect.width;
        let valueFrac = (value - min) / (max - min);
        let valuePx = valueFrac;

        this.customSlider_thumb.style["left"] = "calc(" + valueFrac * 100 + "% - 1.25vh)"; // valuePx * maxPx + "px";
        this.customSlider_valueDisplay_p.innerHTML = ResourceManager.formatResource(value, 3);

        if (value == 0) {
            this.customSlider_thumb.style["background"] = "#5665c2";
        }
        else {
            this.customSlider_thumb.style["background"] = value > 0 ? "rgb(150, 200, 100)" : "rgb(125, 125, 255)";
        }
    }

    setBounds(min, max) {
        this.setAttribute("min", Math.round(min));
        this.setAttribute("max", Math.round(max));
        this.setAttribute("value", this.getAttribute("value"));

        this.thumbRect = this.customSlider_thumb.getBoundingClientRect();
        this.trackRect = this.customSlider_track.getBoundingClientRect();
    }

    setIdValue(idValue) {
        this.customSlider_thumb_p.innerHTML = SymbolDatabase.getSymbol(idValue.id);
        this.resourceId = idValue.id;
        this.setAttribute("value", idValue.value);
    }

    setValue(value) {
        let lastValue = parseFloat(this.getAttribute("value"));
        if (lastValue != value) {
            this.setAttribute("value", value);
            let onValueChange = new CustomEvent('onvaluechange', { "detail": new IdValue(this.resourceId, value) });
            this.dispatchEvent(onValueChange);
        }
    }

    setDisabled(state) {
        this.inputDisabled = state;
        if (state) {
            this.customSlider_container.classList.add("disabled");
        }
        else {
            this.customSlider_container.classList.remove("disabled");
        }
    }
}

customElements.define('adclick-resourceslider', ResourceSlider);