class GlobalAnimations {
    static animateProgressRing(duration, screenPosition) {
        let progressRing = document.createElement("img");
        progressRing.classList.add("adCover_encryptionRing");

        progressRing.src = "";
        void progressRing.offsetHeight;
        progressRing.src = "img/ringProgress.gif";

        progressRing.style["left"] = screenPosition.x + "px";
        progressRing.style["top"] = screenPosition.y + "px";

        document.body.append(progressRing);

        TimerManager.setTimer(duration, function () {
            GlobalAnimations.stopProgressRing(progressRing);
        }.bind(this));

        return progressRing;
    }

    static stopProgressRing(existingRing) {
        if (existingRing == null) return;
        if (existingRing.parentNode == null || existingRing.parentNode == undefined) return;

        existingRing.src = "";
        existingRing.remove();
    }
}