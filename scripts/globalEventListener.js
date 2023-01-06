class GlobalEventListener {
    constructor () {
        this.listeners = {
            resize: []
        };

        this.timeout_resize = false;
        window.addEventListener('resize', this.onResize.bind(this));
    }

    addGlobalListener(eventName, callback) {
        this.listeners[eventName].push(callback);
    }
    removeGlobalListener(eventName, callback) {
        FunLib.removeFromArray(this.listeners[eventName], callback);
    }


    onResize(e) {
        clearTimeout(this.timeout_resize);

        this.timeout_resize = setTimeout(function () {
            for (let callback of this.listeners["resize"]) {
                if (callback == null || callback == undefined) continue;
                callback(e);
            }
        }.bind(this), 100);
    }
}