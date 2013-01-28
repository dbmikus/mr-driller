// Global variables

//colors used for blocks.
// Everything in this array can be drilled.
var colors= ["red","blue","green","purple"];
function canDrill(block) {
    return (colors.indexOf(block.type) > -1);
}

//maximum rows of blocks stored
//blocks dissappear if they are 15 above the bottom of the screen
var maxRows = 15;
// The number of columns of blocks (x width)
var blockcolumns = 7;

// variables so keycodes are more transparent
var downarrow = 40;
var uparrow = 38;
var leftarrow = 37;
var rightarrow = 39;
var spacebar = 32;
var inGame = true;
var worldWidth = 420;
var score = 0;
var driller;
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

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

function setUpWorld() {
    addEmptyBlocks(2);  // add empty blocks at the bottom of the screen
    addBottomBlocks(5,0,0); // add blocks to bottom of screen, pushing them up
    fillEmpty();        // fill the rest of the grid with empty blocks
    driller = new Driller(3,5);

    // adding listeners to control driller
    // Focusing canvas so it can register events
    canvas.setAttribute('tabindex','0');
    canvas.focus();
    canvas.addEventListener('keydown', onKeyDown, false);
}

function gameOver(){
    window.inGame=false;
    drawGameOver();
}

// Stuff that happens every time the timer fires
function onTimer() {
    if(window.inGame=== true){
        drawDisplay(); // draws objects on screen
        gravity();
        driller.breathe();
    }

    blocks = animate(blocks);
}

//checks all things that can fall to see if they should be falling,
//then makes them fall
function gravity() {
    //check if the driller should fall
    if(blocks[driller.column][driller.row-1].type === "empty" ||
        blocks[driller.column][driller.row-1].type === "air"){
        if (driller.countdown === 0) {
            addBottomBlocks(1,
                .01,
                //this argument is the probability of a durable block
                //essentially this is the function from depth to
                //difficulty, since durable blocks make it harder
                Math.pow(driller.depth/100,2)/
                (5*Math.pow((driller.depth+300)/100,2)));
            driller.depth+=5;
            if(window.blocks[driller.column][driller.row].type === "air"){
                driller.airPocket();
                blocks[driller.column][driller.row].type = "empty";
            }
            driller.resetCountdown();
        } else {
            driller.countdown -= 1;
        }
    }

    var fallObj = blockGravity(blocks);
    window.blocks = fallObj.blockGrid;
    //check if driller was crushed
    if(window.blocks[driller.column][driller.row].type!=="empty"){
        driller.kill();
    }
}

function animate(blocks) {
    var x = 0;
    var y = 0;

    // If block is in middle, shake left
    // If block is left, shake right
    function shakeBlock(block) {
        blockOffset = 5;

        if (block.xOffset >= 0) {
            block.xOffset = -blockOffset;
        } else if (block.xOffset < 0) {
            block.xOffset = blockOffset;
        }

        return block;
    }

    for (y = 0; y < maxRows; y++) {
        for (x = 0; x < blockcolumns; x++) {
            if (blocks[x][y].state === "shaking") {
                blocks[x][y] = shakeBlock(blocks[x][y]);
            } else {
                blocks[x][y].xOffset = 0;
            }
        }
    }

    return blocks;
}



// The player's dude
function Driller(column,row) {
    var countdownFactor = 2;

    this.countdown = countdownFactor;
    this.column = column;
    this.row = row;
    this.lives = 2;
    this.alive = true;
    this.depth = 0;
    this.air = 100;
    // Possibilities: left, right, up, down
    this.drillDirection = "down";

    // Receives input to move around digger
    // Also does object collision detection
    // Pretty sure this will only be called with dx or dy non-zero. Not both
    this.move = function (dx, dy) {
        if(this.alive === false){//prevent moving while driller is dead
            return;
        }
        // Checks for object collision for moving
        if(this.column+dx>=0 && this.column+dx<blockcolumns
            && this.row+dy>0 && this.row+dy < blocks[this.column].length
            && (blocks[this.column+dx][this.row+dy].type==="empty"
                || blocks[this.column+dx][this.row+dy].type==="air")){
            this.column += dx;
            if(blocks[this.column][this.row].type==="air"){
                blocks[this.column][this.row].type="empty";
                this.airPocket();
            }
        }

        if (dx < 0) this.drillDirection = "left";
        else if (dx > 0) this.drillDirection = "right";
        else if (dy < 0) this.drillDirection = "down";
        else if (dy > 0) this.drillDirection = "up";
    }

    this.airPocket = function(){
        this.air = Math.min(this.air+30,100);
    }

    this.breathe = function(){
        this.air-=.25;
        if(this.air<0){
            this.kill();
        }
    }

    this.kill = function(){//kills the driller
        this.alive= false;
        this.lives--;
        if(this.lives>=0){
            this.revive();
        }
        else
            gameOver();
    }

    this.revive = function(){
        for(var i= this.column-1;i<=this.column+1;i++){
            if(i<0 || i>=7)
                continue;
            for(var j = this.row; j<maxRows;j++){
                blocks[i][j].type="empty";
            }
        this.air =100;
        this.alive=true;
        }
    }

    this.fall = function(){
        this.row--;
    }

    this.drill = function () {
        var pos;
        if(this.alive===false){
            return;
        }
        if (this.drillDirection === "left")
            pos = [this.column - 1, this.row];
        else if (this.drillDirection === "right")
            pos = [this.column + 1, this.row];
        else if (this.drillDirection === "up")
            pos = [this.column, this.row + 1];
        else if (this.drillDirection === "down")
            pos = [this.column, this.row - 1];


        // Check that block is within the bounds of the grid,
        // and disable player from drilling blocks that are currently falling
        if (pos[0] >= 0 && pos[0] < 7
            && pos[1] >= 0 && pos[1] < 15
            && blocks[pos[0]][pos[1]].state !== "falling") {
            var toDrill = blocks[pos[0]][pos[1]];

            // Checks if the thing we are drilling is a drillable block.
            // Everything in colors can be drilled.
            if (canDrill(toDrill)) {
                // Get the group of blocks to be drilled
                var drillGroup = getBlockGroup(blocks,
                                               pos[0], pos[1], toDrill.type);

                // Drill that group of blocks
                drillGroup.forEach(function (point) {
                    blocks[point.x][point.y] = new Block("empty");
                    window.score+=1;
                });
            }else if(toDrill.type==="durable"){
                toDrill.health--;
                if(toDrill.health===0){
                    blocks[pos[0]][pos[1]] = new Block("empty");
                    this.air-= 10;
                }
            }
        }
    }

    this.resetCountdown = function () {
        this.countdown = countdownFactor;
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
function addBottomBlocks(depth, airProbability, durableProbability){
    var d;
    for(d=0; d<depth; d++){
        var x;
        for(x=0; x<7;x++){
            // pushes a new item onto the beginning of the array
            blocks[x].unshift(new Block(colors[Math.floor(Math.random()*colors.length)]));
            if(Math.random()<airProbability){
                blocks[x][0].type = "air";
            }else if(Math.random()<durableProbability){
                blocks[x][0].type = "durable";
            }
            if(blocks[x].length>15){
                blocks[x].pop();
            }
        }
    }
    return blocks;
}

function fillEmpty() {
    var x;
    for (x=0; x < blockcolumns; x++) {
        var y;
        while (blocks[x].length < maxRows) {
            blocks[x].push(new Block("empty"));
        }
    }
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


///////// graphics and drawing stuff /////////

function drawScoreboard(width, height) {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,worldWidth,canvas.height);
    ctx.fillRect(canvas.width - width,0,width,height);
    ctx.fillStyle = "green";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.font = "35px Arial";
    ctx.fillText("LIVES ",
        canvas.width - width + 10 , height/9);
    ctx.textAlign="right";
    ctx.fillText(""+driller.lives,
        canvas.width - 10 , 2*height/9);
    ctx.textAlign= "left";
    ctx.fillStyle = "red";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        3*height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.fillText("DEPTH: ",
        canvas.width - width + 10 , 3*height/9);
    ctx.textAlign="right";
    ctx.fillText(""+driller.depth+"ft",
        canvas.width -10  , 4*height/9);
    ctx.textAlign= "left";
    ctx.fillStyle = "blue";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        5*height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.fillText("AIR: ",
        canvas.width - width + 10 , 5*height/9);
    drawRoundedRectangle(ctx,canvas.width - width + 10,
        5.7*height/9,
        width-20,20,5);
    ctx.fillStyle= "lightblue";
    drawRoundedRectangle(ctx,
        (canvas.width - width + 15)+(1-driller.air/100)*(width -30),
        5.7*height/9 +5,
        (width-30)*(driller.air/100),10,1);
    ctx.fillStyle= "purple";
    drawRoundedRectangle(ctx,canvas.width - width + 5,
        7*height/9 -30,
        width-5,35,5);
    ctx.fillStyle = "white";
    ctx.fillText("SCORE: ",
        canvas.width - width + 10 , 7*height/9);
    ctx.textAlign="right";
    ctx.fillText(""+window.score+"",
        canvas.width -10  , 8*height/9);
    ctx.textAlign= "left";



}


function drawGameOver(){
    ctx.textAlign="left";
    ctx.fillStyle= "rgba(0,0,0,.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fill();
    ctx.fillStyle= "rgba(255,255,255,.5)";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
}

function drawDriller(){
    // Draws Mr. Driller body
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(driller.column*60+30,
        canvas.height - driller.row*60+30, 29, 0, 2*Math.PI, true);
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
    drawScoreboard(canvas.width - worldWidth, canvas.height);
    drawWorld();
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

// If blocks are adjacent and same color, connects them
function drawBlock(column,row,type){
    //dont draw anything for empty blocks
    if(type ==="empty")
        return;
    if(type==="blue")
        ctx.fillStyle = "blue";
    else if(type==="green")
        ctx.fillStyle = "green";
    else if(type==="red")
        ctx.fillStyle = "red";
    else if(type==="purple")
        ctx.fillStyle = "purple";
    // drawing air and durables should be different
    // they don't connect
    else if(type==="air")
        ctx.fillStyle = "lightblue";
    else if(type==="durable")
        ctx.fillStyle = "brown";
    var hasAdjacent = false;

    //detects overlap
    if(column>0 && blocks[column-1][row].type===type) {
        drawRoundedRectangle(ctx,
                             (column-1)*60+5 + blocks[column][row].xOffset,
                             canvas.height-index*60+5,
                             110, 50, 5);
        hasAdjacent = true;
    }
    if(row>0 && blocks[column][row-1].type===type) {
        drawRoundedRectangle(ctx,
                             column*60+5 + blocks[column][row].xOffset,
                             canvas.height-index*60+5,
                             50, 110, 5);
        hasAdjacent = true;
    }
    if(hasAdjacent===false) {
        drawRoundedRectangle(ctx,
                             column*60+5 + blocks[column][row].xOffset,
                             canvas.height-index*60+5,
                             50, 50, 5);
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
