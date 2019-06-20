let images = [];    // All the images which are to be used by the tiles
let tiles = [];     // All the tiles, including those whose images might not have loaded

let loading;        // To store the loading image
let uploading;      // A boolean to indicate when uploading a new image

const TILE_SIZE = 128;
const CANVAS_WIDTH = 1152;
const CANVAS_HEIGHT = 896;

/*-------------------------------------------------------
This function runs when the page first loads. Look for
the line <body onload="pageLoad()"> in the HTML file.
------------------------------------------------------*/
function pageLoad() {

    loading = new Image();
    loading.src = "/client/img/loading.png";

    setInterval(update, 1000);              // Run update every second (1000ms)
    update();

    document.getElementById('canvas').addEventListener("click", canvasClick)           // Run canvasClick when the canvas is clicked

}

/*-------------------------------------------------------
This function runs once every second to request a list of
images and tiles from the server. It then redraws the canvas.
------------------------------------------------------*/
function update() {

    if (uploading) return;

    fetch('/image/list', {method: 'get'},       // Get a list of all the images from the server
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
            if (!alreadyKnown) {               // Add new ones if required, skip ones we've already loaded
                let newImage = new Image();
                newImage.src = receivedImage.path;
                newImage.addEventListener("load", function() {          // Add the image to images when it's loaded
                    images.push(newImage);
                });
            }
        }

        fetch('/tile/list', {method: 'get'},        // Get a list of all the tiles from the server
        ).then(response => response.json()
        ).then(tileData => {

            tiles.length = 0;                       // Erase the current tile list...

            for (let tile of tileData) {            // ... rebuild it using the data from the server
                tiles.push({x: tile.x, y: tile.y, path: tile.path});
            }

            drawCanvas();

        });

    });
}

/*-------------------------------------------------------
This function redraws the canvas. It is called after each update.
------------------------------------------------------*/
function drawCanvas() {

    let context = document.getElementById('canvas').getContext('2d');

    context.globalCompositeOperation = 'source-over';

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);           // Clear the canvas

    for (let tile of tiles) {       // Loop through all the tiles

        let loaded = false;
        for (let image of images) {                     // Draw them if their image has loaded
            if (image.src.endsWith(tile.path)) {
                context.save();
                context.translate(tile.x * TILE_SIZE, tile.y * TILE_SIZE);
                context.drawImage(image, 0, 0);
                context.restore();
                loaded = true;
                break;
            }
        }

        if (!loaded) {              // Draw a loading image if the tile's image hasn't loaded yet
            context.save();
            context.translate(tile.x * TILE_SIZE + (TILE_SIZE - 100) / 2, tile.y * TILE_SIZE + (TILE_SIZE - 100) / 2);
            context.drawImage(loading, 0, 0);
            context.restore();
        }

    }

}


/*-------------------------------------------------------
This function runs when the canvas is clicked. If an image
has been chosen it will call the API request to post it.
------------------------------------------------------*/
function canvasClick(event) {

    let imageFile = document.getElementById("file");
    if (imageFile.files[0] === undefined) return;               // If no image file has been chosen then ignore the click

    /* Get the mouse click's co-ordinates (quite a tricky process!) */
    let canvas = document.getElementById('canvas');
    let mouseX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - canvas.offsetLeft;
    let mouseY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - canvas.offsetTop;

    let x = Math.floor(mouseX / TILE_SIZE);
    let y = Math.floor(mouseY / TILE_SIZE);

    uploading = true;
    tiles.push({x: x, y: y, path: "-"});        // Add a temporary tile (causes a loading image to appear)
    drawCanvas();

    let imageForm = document.getElementById("imageUploadForm");
    let imageFormData = new FormData(imageForm);

    fetch('/image/upload', {method: 'post', body: imageFormData},       // Upload the image to the server
    ).then(response => response.json()
    ).then(data => {

        let tileFormData = new FormData();              // Create a new tile object...
        tileFormData.append("path", data.path);
        tileFormData.append("x", x);
        tileFormData.append("y", y);

        fetch('/tile/new', {method: 'post', body: tileFormData},        // ... and send that to the server too
        ).then(response => response.json()
        ).then(data => {
            uploading = false;
        });

        imageFile.value = "";               // Reset the file upload form

    });

}