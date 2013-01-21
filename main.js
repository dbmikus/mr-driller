// Global variables
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

function main() {
    drawDisplay();

    var driller = new Driller(100, 100);
    console.log(driller);
}

function Driller(startX, startY) {
    this.xPos = startX;
    this.yPos = startY;

    this.move = function (dx, dy) {
        this.xPos += dx;
        this.yPos += dy;
    }

    window.ctx.fillRect(this.xPos, this.yPos, 50, 50);
}

function drawScoreboard(width, height) {
    ctx.beginPath();
    ctx.moveTo(canvas.width - width, 0);
    // Drawing vertical divider line
    ctx.lineTo(canvas.width - width, height);
    ctx.stroke();
}

function drawWorld(width, height) {
    console.log("Not implemented.");
}

function drawDisplay() {
    worldWidth = 450;
    drawScoreboard(canvas.width - worldWidth, canvas.height);
    drawWorld(worldWidth, canvas.height);
}

main();
