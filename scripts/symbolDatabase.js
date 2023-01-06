class SymbolDatabase {

    static getSymbol(name) {
        switch (name) {
            case "money":
                //return "💲";
                return '<img src="svg/heavyDollarSign.svg" alt="dollar" class="iconSymbol">';
            
            case "adStrike":
                //return "🧨";
                return '<img src="svg/firecracker.svg" alt="firecracker" class="iconSymbol">';

            case "encryption":
                //return "🔑";
                return '<img src="svg/key.svg" alt="key" class="iconSymbol">';
        }
    }

    static toRoman(value) {
        if (isNaN(value)) {
            return NaN;
        }

        let digits = String(+value).split("");
        let key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
            "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
            "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
        let roman = "";

        let i = 3;
        while (i--)
            roman = (key[+digits.pop() + (i * 10)] || "") + roman;
        return Array(+digits.join("") + 1).join("M") + roman;
}
}