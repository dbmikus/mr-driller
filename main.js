// Global variables

//colors used for blocks.
// Everything in this array can be drilled.
var colors= ["red","blue","green","purple"];


// variables so keycodes are more transparent
var downarrow = 40;
var uparrow = 38;
var leftarrow = 37;
var rightarrow = 39;
var spacebar = 32;



var driller;
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// The number of columns of blocks (x width)
var blockcolumns = 7;
// A 2D array of blocks. Block at pos (0,0) is one below canvas display on
// left side. This is like cartesian plane coordinates
var blocks=[];
for(i=0;i<blockcolumns;i++){
    blocks.push([]); // add second dimensional arrays to each index
}

// Sets up the world and draws objects on canvas
function main() {
    setUpWorld();  // does not handle drawings of objects

    // Creating timer to draw screen
    var timerDelay = 100;

    var intervalId = setInterval(onTimer, timerDelay);
}

// Stuff that happens every time the timer fires
function onTimer() {
    drawDisplay(); // draws objects on screen
}

//Block object
function Block(type){
    //string describing the content of the block
    this.type = type;
}

// The player's dude
function Driller(column,row) {
    this.column = column;
    this.row = row;

    // Possibilities: left, right, up, down
    this.drillDirection = "down";

    // Receives input to move around digger
    // Also does object collision detection
    // Pretty sure this will only be called with dx or dy non-zero. Not both
    this.move = function (dx, dy) {
        // Checks for object collision for moving
        if(this.column+dx>=0 && this.column+dx<blockcolumns
            && this.row+dy>0 && this.row+dy < blocks[this.column].length
            && blocks[this.column+dx][this.row+dy].type==="empty"){
            this.column += dx;
        }

        if (dx < 0) this.drillDirection = "left";
        else if (dx > 0) this.drillDirection = "right";
        else if (dy < 0) this.drillDirection = "down";
        else if (dy > 0) this.drillDirection = "up";
    }

    this.drill = function () {
        var pos;

        if (this.drillDirection === "left")
            pos = [this.column - 1, this.row];
        else if (this.drillDirection === "right")
            pos = [this.column + 1, this.row];
        else if (this.drillDirection === "up")
            pos = [this.column, this.row + 1];
        else if (this.drillDirection === "down")
            pos = [this.column, this.row - 1];


        var toDrill = blocks[pos[0]][pos[1]];
        // Checks if the thing we are drilling is a drillable block.
        // Everything in colors can be drilled.

        if (colors.indexOf(toDrill.type) > -1) {
            blocks[pos[0]][pos[1]] = new Block("empty");
        }
    }
}

//adds a line of empty blocks at the bottom
//used for initiating the screen
function addEmptyBlocks(depth){
    for(d=0; d<depth; d++){
        for(x=0; x<7;x++){
            // pushes a new item onto the beginning of the array
            blocks[x].unshift(new Block("empty"));
        }
    }
    return blocks;
}


// Called whenever Mr. Driller moves down or whenever we want to add a new row
// of blocks to the bottom of the array
function addBottomBlocks(depth){
    for(d=0; d<depth; d++){
        for(x=0; x<7;x++){
            // pushes a new item onto the beginning of the array
            blocks[x].unshift(new Block(colors[Math.floor(Math.random()*colors.length)]));
        }
    }
    return blocks;
}

function onKeyDown(event) {
    var keycode = event.keyCode;

    // Variables for where Mr. Driller moves
    var dx = 0;
    var dy = 0;

    if (keycode === leftarrow) dx--
    else if (keycode === rightarrow) dx++;
    else if (keycode === downarrow) dy--;
    else if (keycode === uparrow) dy++;

    // Shouldn't be able to move up or down by keypresses.

    if (dx !== 0 || dy !== 0) {
        driller.move(dx, dy); // TODO: this is probably messed up
    }

    // Drilling stuff
    if (keycode === spacebar) {
        driller.drill();
    }
}

function setUpWorld(){
    addEmptyBlocks(2);
    addBottomBlocks(5);
    driller = new Driller(3,5);

    // adding listeners to control driller
    // Focusing canvas so it can register events
    canvas.setAttribute('tabindex','0');
    canvas.focus();
    canvas.addEventListener('keydown', onKeyDown, false);
}





//graphics

function drawScoreboard(width, height) {
    ctx.beginPath();
    ctx.moveTo(canvas.width - width, 0);
    // Drawing vertical divider line
    ctx.lineTo(canvas.width - width, height);
    ctx.stroke();
}


// Just offshores (to China) the drawing of blocks and figuring out whether to
// connect blocks visually
function drawBlocks(){
    for(column=0;column<blockcolumns;column++){
        for(index=0; index<blocks[column].length;index++){
            drawBlock(column,index,blocks[column][index].type);
        }
    }
}

function drawDriller(){
    // Draws Mr. Driller body
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(driller.column*60+30, canvas.height - driller.row*60+30, 29, 0, 2*Math.PI, true);
    ctx.fill();

    // Draw Mr. Driller's drill
    ctx.beginPath();
    ctx.fillStyle = "brown";

    var drillOffset = 15;
    if (driller.drillDirection === "down") {
        ctx.arc(driller.column*60+30,
                canvas.height - driller.row*60+30 + drillOffset,
                10, 0, 2*Math.PI, true);
    }
    else if (driller.drillDirection === "up") {
        ctx.arc(driller.column*60+30,
                canvas.height - driller.row*60+30 - drillOffset,
                10, 0, 2*Math.PI, true);
    }
    else if (driller.drillDirection === "left") {
        ctx.arc(driller.column*60+30 - drillOffset,
                canvas.height - driller.row*60+30,
                10, 0, 2*Math.PI, true);
    }
    else if (driller.drillDirection === "right") {
        ctx.arc(driller.column*60+30 + drillOffset,
                canvas.height - driller.row*60+30,
                10, 0, 2*Math.PI, true);
    }

    ctx.fill();
}

function drawWorld() {
    reset();
    drawBlocks();
    drawDriller();
}


// This is the drawing function that happens every time
function drawDisplay() {
    worldWidth = 420;
    drawScoreboard(canvas.width - worldWidth, canvas.height);
    drawWorld();
}


// If blocks are adjacent and same color, connects them
function drawBlock(column,row,color){
    //dont draw anything for empty blocks
    if(color ==="empty")
        return;
    if(color==="blue")
        ctx.fillStyle = "blue";
    else if(color==="green")
        ctx.fillStyle = "green";
    else if(color==="red")
        ctx.fillStyle = "red";
    else if(color==="purple")
        ctx.fillStyle = "purple";
    var hasAdjacent = false;
    //detects overlap
    if(column>0 && blocks[column-1][row].type===color){
        drawRoundedRectangle(ctx,(column-1)*60+5,canvas.height-index*60+5,
            110,50,5,color);
        hasAdjacent =true;
    }
    if(row>0 && blocks[column][row-1].type===color){
        drawRoundedRectangle(ctx,column*60+5,canvas.height-index*60+5,
            50,110,5,color);
        hasAdjacent = true;
    }
    if(hasAdjacent===false){
        drawRoundedRectangle(ctx,column*60+5,canvas.height-index*60+5,
            50,50,5,color);
    }
}

function reset(){
    ctx.fillStyle= "black";
    ctx.fillRect(0,0,worldWidth,canvas.height);
}

function drawRoundedRectangle(ctx,x,y,width,height,radius){
    ctx.beginPath();
    ctx.moveTo(x,y+radius);
    ctx.lineTo(x,y+height-radius);
    ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
    ctx.lineTo(x+width-radius,y+height);
    ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
    ctx.lineTo(x+width,y+radius);
    ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
    ctx.lineTo(x+radius,y);
    ctx.quadraticCurveTo(x,y,x,y+radius);
    ctx.fill();
}



main();
