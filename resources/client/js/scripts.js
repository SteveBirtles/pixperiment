let images = [];
let tiles = [];
let spinner;

function pageLoad() {

    spinner = new Image();
    spinner.src = "/client/img/loading.png";

    setInterval(update, 1000);
    update();

    document.getElementById('canvas').addEventListener("click", canvasClick)


}

function canvasClick(event) {

    let imageFile = document.getElementById("file");
    if (imageFile.files[0] === undefined) return;

    let imageForm = document.getElementById("imageUploadForm");

    let x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    let y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;

    let canvas = document.getElementById('canvas');

    x = Math.floor((x - canvas.offsetLeft) / 200);
    y = Math.floor((y - canvas.offsetTop) / 200);

    let imageFormData = new FormData(imageForm);

    tiles.push({x: x, y: y, path: "-"});
    drawCanvas();

    fetch('/image/upload', {method: 'post', body: imageFormData},
    ).then(response => response.json()
    ).then(data => {

        let tileFormData = new FormData();
        tileFormData.append("path", data.path);
        tileFormData.append("x", x);
        tileFormData.append("y", y);

        fetch('/tile/new', {method: 'post', body: tileFormData},
        ).then(response => response.json()
        ).then(data => {});

        imageFile.value = "";

    });

}

function update() {

    fetch('/image/list', {method: 'get'},
    ).then(response => response.json()
    ).then(imageList => {

        for (let receivedImage of imageList) {

            let alreadyKnown = false;
            for (let existingImage of images) {
                if (existingImage.src.endsWith(receivedImage.path)) {
                    alreadyKnown = true;
                    break;
                }
            }
            if (!alreadyKnown) {
                let newImage = new Image();
                newImage.src = receivedImage.path;
                newImage.addEventListener("load", function() {
                    images.push(newImage);
                });
            }
        }

        fetch('/tile/list', {method: 'get'},
        ).then(response => response.json()
        ).then(tileData => {

            tiles.length = 0;

            for (let tile of tileData) {
                tiles.push({x: tile.x, y: tile.y, path: tile.path});
            }

            drawCanvas();

        });

    });
}

function drawCanvas() {

    let context = document.getElementById('canvas').getContext('2d');

    context.globalCompositeOperation = 'source-over';

    context.clearRect(0, 0, 1200, 800);

    for (let tile of tiles) {

        let loaded = false;
        for (let image of images) {
            if (image.src.endsWith(tile.path)) {
                context.save();
                context.translate(tile.x * 200, tile.y * 200);
                context.drawImage(image, 0, 0);
                context.restore();
                loaded = true;
                break;
            }
        }

        if (!loaded) {
            context.save();
            context.translate(tile.x * 200 + 50, tile.y * 200 + 50);
            context.drawImage(spinner, 0, 0);
            context.restore();
        }

    }

}

