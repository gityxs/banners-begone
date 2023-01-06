class DataPreloader {
    constructor() {
        this.preloaded_img = [];
    }

    preloadAllAdImages() {
        let validDimensions = [
            [1,1],
            [1,2],
            [1,4],
            [2,1],
            [2,2],
            [3,1],
            [3,2],
            [3,3],
        ];
        let imageCount = 3;

        for (let dimension of validDimensions) {
            for (let index = 1; index <= imageCount; index++) {
                let fileString = "ads/" + dimension[0] + "x" + dimension[1] + "/" + index + ".png";

                let img = new Image();
                img.src = fileString;
                this.preloaded_img.push(img);
            }
        }
    }
}