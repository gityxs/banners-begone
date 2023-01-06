class HighScores {
    static getHighScore_time() {
        return 3300000;
    }
    static getHighScore_resource(resourceId) {
        switch (resourceId) {
            case "money":
                return 10000000;
            case "adStrike":
                return 4500000;
            case "encryption":
                return 90000;
        }
    }
    static getHighScore_adPusher() {
        return 1250;
    }
    static getHighScore_endlessObject() {
        let firstLoopScore = 2000000000; // set to unlocking all upgrades and AFTERWARDS playing for ~10 minutes
        let firstLoopPow = 50;
        let growthRate = 1.2;
        let minScore = firstLoopScore / Math.pow(growthRate, 1 * firstLoopPow);
        
        return { firstLoopScore: firstLoopScore, firstLoopPow: firstLoopPow, minScore: minScore, growthRate: growthRate };
    }

    static getRankString(score) {
        let rankText = HighScores.getRankText(score);

        return '<mark class="colorInverse">' + rankText.letter + '</mark> ' + rankText.comment;
    }
    static getRankScores(time, resources) {
        let lowerBound = 0.5;
        let upperBound = 1.233;
        let scoresObject = {};
        let avgScore = 0;
        let scoreAmount = 0;

        scoresObject.time = FunLib.clamp(2 - time / HighScores.getHighScore_time(), lowerBound, upperBound);
        avgScore += scoresObject.time;
        scoreAmount++;

        for (let resource of resources) {
            scoresObject[resource.id] = FunLib.clamp(resource.value / HighScores.getHighScore_resource(resource.id), lowerBound, upperBound);
            avgScore += scoresObject[resource.id];
            scoreAmount++;
        }
        
        scoresObject.average = avgScore / scoreAmount;

        return scoresObject;
    }
    static getRankText(score) {
        let rankText = {};

        if (score >= 1.2) {
            rankText.letter = "S+";
            rankText.comment = "Impossible...";
        }
        else if (score >= 1.1) {
            rankText.letter = "S";
            rankText.comment = "Admirable!";
        }
        else if (score >= 1) {
            rankText.letter = "A+";
            rankText.comment = "Perfect!";
        }
        else if (score >= 0.9) {
            rankText.letter = "A";
            rankText.comment = "Amazing!";
        }
        else if (score >= 0.8) {
            rankText.letter = "B+";
            rankText.comment = "Wonderful!";
        }
        else if (score >= 0.7) {
            rankText.letter = "B";
            rankText.comment = "Great!";
        }
        else if (score >= 0.6) {
            rankText.letter = "C+";
            rankText.comment = "Nice!";
        }
        else { // if (score >= 0.5) {
            rankText.letter = "C";
            rankText.comment = "Not bad!";
        }

        return rankText;
    }

    static getEndlessRankString(score) {
        let rankText = HighScores.getEndlessRankText(score);

        return '<mark class="colorInverse">' + rankText.letter + '</mark> ' + rankText.comment;
    }
    static getEndlessRankScores(endlessScore, resources) {
        let scoresObject = {};
        let endlessObject = HighScores.getHighScore_endlessObject();

        let scoreGrowthRate = endlessObject.growthRate;
        let minScoreValue = endlessObject.minScore;
        scoresObject.average = Math.log(endlessScore / minScoreValue) / Math.log(scoreGrowthRate) / endlessObject.firstLoopPow;
        
        scoresObject.average = FunLib.clamp(scoresObject.average, 0, scoresObject.average);
        scoresObject.endlessScore = scoresObject.average;

        return scoresObject;
    }
    static getEndlessRankText(score) {
        let rankText = {letter: "", comment: ""};
        let letterArray = ["Z", "Y", "X", "W", "V", "U", "T", "R", "Q", "P", "O", "N", "M", "L", "K", "J", "I", "H", "G", "F", "E", "D", "C", "B", "A", "S"];
        let commentArray = ["Zucchini", "Yam", "Xylocarp", "Watermelon", "Vanilla", "Uchuva", "Tomato", "Radish", "Quince", "Peach", "Onion", "Nectarine", "Mulberry", "Leek", "Kiwifruit", "Jalapeno", "Ilama", "Huckleberry", "Ginger", "Fiddlehead", "Eggplant", "Durian", "Coconut", "Banana", "Apricot", "Super Strawberry!!!"];
        for (let i = letterArray.length - 2; i >= 0; i--) {
            letterArray.splice(i + 1, 0, letterArray[i] + "+");
        }
        for (let i = commentArray.length - 2; i >= 0; i--) {
            commentArray.splice(i + 1, 0, "Yummy " + commentArray[i] + "!");
            commentArray[i] = commentArray[i] + "!";
        }
        let letterWeight = 1 / letterArray.length;

        let choice = Math.floor(score / letterWeight);
        let loops = Math.floor(choice / letterArray.length);
        choice -= loops * letterArray.length;

        while (loops >= 1) {
            rankText.letter += "S";
            loops--;
        }
        rankText.letter += letterArray[choice];
        rankText.comment += commentArray[choice];

        return rankText;
    }
    static testEndlessRankText() {
        for (let i = 0; i <= 153; i++) {
            let score = i / 51;
            let text = HighScores.getEndlessRankText(score);
            console.log("Score: " + score + " | Letter: " + text.letter + " " + text.comment);
        }
    }
    static testEndlessRankScore() {
        let endlessObject = HighScores.getHighScore_endlessObject();
        let base = endlessObject.minScore;
        let growthRate = endlessObject.growthRate;

        for (let pow = 0; pow <= endlessObject.firstLoopPow * 2; pow++) {
            let result = Math.floor(base * Math.pow(growthRate, pow));
            let endlessScores = HighScores.getEndlessRankScores(result);
            let text = HighScores.getEndlessRankText(endlessScores.average);

            console.log("Pow: " + pow + " | Result: " + result + " | Score: " + endlessScores.average + " | Letter: " + text.letter + " " + text.comment);
        }
    }
}