let images = [];
let tiles = [];
let loading;

const TILE_SIZE = 128;
const CANVAS_WIDTH = 1152;
const CANVAS_HEIGHT = 896;

function pageLoad() {

    loading = new Image();
    loading.src = "/client/img/loading.png";

    setInterval(update, 1000);
    update();

    document.getElementById('canvas').addEventListener("click", canvasClick)

}

function canvasClick(event) {

    let imageFile = document.getElementById("file");
    if (imageFile.files[0] === undefined) return;

    let canvas = document.getElementById('canvas');
    let mouseX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - canvas.offsetLeft;
    let mouseY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - canvas.offsetTop;

    let x = Math.floor(mouseX / TILE_SIZE);
    let y = Math.floor(mouseY / TILE_SIZE);

    tiles.push({x: x, y: y, path: "-"});
    drawCanvas();

    let imageForm = document.getElementById("imageUploadForm");
    let imageFormData = new FormData(imageForm);

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

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let tile of tiles) {

        let loaded = false;
        for (let image of images) {
            if (image.src.endsWith(tile.path)) {
                context.save();
                context.translate(tile.x * TILE_SIZE, tile.y * TILE_SIZE);
                context.drawImage(image, 0, 0);
                context.restore();
                loaded = true;
                break;
            }
        }

        if (!loaded) {
            context.save();
            context.translate(tile.x * TILE_SIZE + (TILE_SIZE - 100) / 2, tile.y * TILE_SIZE + (TILE_SIZE - 100) / 2);
            context.drawImage(loading, 0, 0);
            context.restore();
        }

    }

}

