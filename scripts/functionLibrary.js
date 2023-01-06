class FunLib {
    constructor() {}

    static clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }
    
    static removeFromArray(array, element) {
        let index = array.indexOf(element);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    static lerpNumber(fraction, min, max) {
        return (max - min) * fraction + min;
    }

    static lerpColor(fraction, min, max) {
        return [FunLib.lerpNumber(fraction, min[0], max[0]), FunLib.lerpNumber(fraction, min[1], max[1]), FunLib.lerpNumber(fraction, min[2], max[2])];
    }

    static getColorString(color) {
        return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
    }

    static prettifyExpNum(num, base, maxMeaningfulDigits) {
        let result = num;
        
        let baseDigits = 0;
        let baseCopy = base;
        while (baseCopy > 0) {
            baseCopy = Math.floor(baseCopy / 10);
            baseDigits++;
        }
        let baseDecimalVal = Math.pow(10, baseDigits - 1);
        result = Math.round(result / baseDecimalVal) * baseDecimalVal;

        let meaningfulDigits = 0;
        let resCopy = result;
        while (resCopy > 0) {
            resCopy = Math.floor(resCopy / 10);
            meaningfulDigits++;
        }
        
        if (meaningfulDigits > maxMeaningfulDigits) {
            let maxDecimal = Math.pow(10, meaningfulDigits - maxMeaningfulDigits);
            result = Math.round(result / maxDecimal) * maxDecimal;
        }

        return result;
    }
    
    static sign(num) {
        return num >= 0 ? 1.0 : -1.0;
    }

    static minNumber(numberArray) {
        if (numberArray.length <= 0) return -Infinity;
        if (numberArray.length == 1) return numberArray[0];

        let minNumber = Infinity;
        for (let num of numberArray) {
            if (num < minNumber) {
                minNumber = num;
            }
        }

        return minNumber;        
    }

    static maxNumber(numberArray) {
        if (numberArray.length <= 0) return Infinity;
        if (numberArray.length == 1) return numberArray[0];

        let maxNumber = -Infinity;
        for (let num of numberArray) {
            if (num > maxNumber) {
                maxNumber = num;
            }
        }

        return maxNumber;
    }
}