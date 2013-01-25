// Global variables
// TODO delete after testing
window.doGravity = true

//colors used for blocks.
// Everything in this array can be drilled.
var colors= ["red","blue","green","purple"];
function canDrill(block) {
    return (colors.indexOf(block.type) > -1);
}

//maximum rows of blocks stored
//blocks dissappear if they are 15 above the bottom of the screen
var maxRows = 15;
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
    gravity();
}

//checks all things that can fall to see if they should be falling,
//then makes them fall
function gravity(){
    //check if the driller should fall
    if(blocks[driller.column][driller.row-1].type === "empty"){
        addBottomBlocks(1);
    }

    blockGravity();
}

function blockGravity() {
    // Checks if any of the groups of blocks should fall
    // Creates an array the size of our blocks array.
    // "unchecked" means the space hasn't been checked for falling yet
    // "falls" means the space will fall
    // "stays" means the space will not fall
    // This way, we don't repeatedly check different parts of the same group.
    var checkedGrid = [];
    var i;
    for (i = 0; i < blocks.length; i++) {
        var inner = [];
        var j;
        for (j=0; j < blocks[i].length; j++) {
            inner.push("unchecked");
        }
        checkedGrid.push(inner);
    }

    // Start at the bottom row and check to see if groups of blocks will fall.
    // Then, look at rows above and check to see if the blocks below are empty,
    // which means they can fall into those empty spaces,
    // or if the blocks below will also fall, which means the whole column up
    // until that point will fall.
    // We need to start at the bottom so that multiple groups can fall in unison
    var y;
    for (y=0; y<maxRows; y++) {
        var x;
        for (x=0; x<blockcolumns; x++) {
            // Group the block is part of has not yet been checked.
            if (blocks[x][y].type === "empty")
                checkedGrid[x][y] = "falls";
            else if (checkedGrid[x][y] === "unchecked") {
                // The block will not be empty
                var groupList = getBlockGroup(x, y, blocks[x][y].type);

                // If the group can fall, add it to the list of falling
                // groups, which we will move at the end of the block
                // gravity loop.
                // This adds the group to the checkedGrid
                checkedGrid = (groupFalls(groupList, checkedGrid));
            }
        }
    }

    // Move all blocks that fall down by one.
    // If they are on the bottom and are falling, just forget about them. This
    // should only happen to empty blocks on the bottom row, which I'm pretty
    // sure we won't spawn, but it's better to be safe than sorry.
    // We start on the second row because the bottom row cannot move down
    // any further.
    // We start at the bottom and work our way up so we do not overwrite
    // anything.
    for (y=1; y<maxRows; y++) {
        for(x=0; x<blockcolumns; x++) {
            // if (blocks[x][y].type !== "empty"
            //     && checkedGrid[x][y] === "falls") {
            // Empty blocks only fall downwards if they are falling into a space
            // that will become empty.
            // TODO There might be a cleaner way to do this.
            if (checkedGrid[x][y] === "falls") {
                if (blocks[x][y].type === "empty") {
                    if (checkedGrid[x][y-1] === "falls") {
                        blocks[x][y-1] = blocks[x][y];
                    }
                }
                else {
                    blocks[x][y-1] = blocks[x][y];
                    // If something would fall into the top row, just make it
                    // empty. This way we don't have a forever falling column
                    if (y === maxRows-1 || checkedGrid[x][y+1] === "stays")
                        blocks[x][y] = new Block("empty");
                }
            }
        }
    }

    return checkedGrid;
}

// Expects a valid block grouping.
// Checks that every block in the group is capable of falling one square.
// Returns true if that is the case.
function groupFalls(groupList, checkedGrid) {
    var canFall = true;

    groupList.forEach(function (p) {
        // Set the status to checking to avoid infinite recursion
        checkedGrid[p.x][p.y] = "checking";

        // Checks to see if the group is on the bottom of the grid
        // and cannot go any lower
        if (p.y === 0) canFall = false;

        // If the space below is not the bottom row and it is empty,
        // then set it to falls
        else if (blocks[p.x][p.y-1].type === "empty") {
            checkedGrid[p.x][p.y-1] = "falls";
        }

        // Case for lower block: "stays"
        // Check if the block below must stay and cannot fall
        if (canFall && checkedGrid[p.x][p.y-1] === "stays") {
            canFall = false;
        }
        // Case for lower block: "unchecked"
        // The block below is not empty, and it is unchecked, so check the group
        // it belongs to and then report back.
        // Should only do recursive check if we are looking at a different
        // group, so compare types and only proceed if unequal.
        else if (canFall && checkedGrid[p.x][p.y-1] === "unchecked"
                && blocks[p.x][p.y].type !== blocks[p.x][p.y-1]) {
            checkedGrid = groupFalls(getBlockGroup(p.x, p.y-1,
                                                   blocks[p.x][p.y-1].type),
                                    checkedGrid);

            // At this point, we should have recursively looked below until the
            // spot has value "falls" or "stays"
            if (checkedGrid[p.x][p.y-1] === "stays") canFall = false;
        }
        // Case for lower block: "falls"
        // TODO: Case is redundant and unecessary. Remove it
        else if (canFall && checkedGrid[p.x][p.y-1] === "falls")
            canFall = true;
    });

    // If canFall is true, then set the whole group to "falls"
    // Otherwise, set it to "stays"
    if (canFall) {
        groupList.forEach(function (p) {
            checkedGrid[p.x][p.y] = "falls";
        });
    }
    // Otherwise, some part of the group cannot fall so the whole group
    // cannot fall
    else {
        groupList.forEach(function (p) {
            checkedGrid[p.x][p.y] = "stays";
        });
    }

    // At this point, the group should either be all "falls" or all "stays". It
    // should not be unchecked or checking
    return checkedGrid;
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

    this.fall = function(){
        this.row--;
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


        if (pos[0] >= 0 && pos[0] < 7
            && pos[1] >= 0 && pos[1] < 15) {
            var toDrill = blocks[pos[0]][pos[1]];

            // Checks if the thing we are drilling is a drillable block.
            // Everything in colors can be drilled.
            if (canDrill(toDrill)) {
                // Get the group of blocks to be drilled
                var drillGroup = getBlockGroup(pos[0], pos[1], toDrill.type);

                // Drill that group of blocks
                drillGroup.forEach(function (point) {
                    blocks[point.x][point.y] = new Block("empty");
                });
            }
        }
    }
}


// Given a position and a type of block, recursively finds a connected group of
// blocks of that type starting at that position. Returns an array of points,
// with a point for each block in the group
function getBlockGroup(x, y, blockType) {
    var checkTable = {};
    var groupList = [];

    function formatKey(x, y) {
        return (String(x) + " " + String(y));
    }

    function wasChecked (x, y) {
        return checkTable[formatKey(x,y)] !== undefined;
    }

    function getBlockGroupHelper(x, y, blockType) {
        if (x >= 0 && x < 7 // checking column borders
            && y >= 0 && y < 15 // checking row borders
            && blocks[x][y].type === blockType) { // checking for part of group
            // determining if checked already to stop infinite recursion
            if (!wasChecked(x,y)) {
                // Add the block to the list of blocks in the group
                groupList.push({"x" : x, "y": y});
                // Add the item to the checked hash table
                checkTable[formatKey(x,y)] = true;

                // Recursively check neighboring blocks to see if they are the
                // same color, and if so add them to group
                getBlockGroupHelper(x+1, y,   blockType);
                getBlockGroupHelper(x-1, y,   blockType);
                getBlockGroupHelper(x,   y+1, blockType);
                getBlockGroupHelper(x,   y-1, blockType);
            }
        }

        return groupList;
    }

    return getBlockGroupHelper(x, y, blockType);
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
    var d;
    for(d=0; d<depth; d++){
        var x;
        for(x=0; x<7;x++){
            // pushes a new item onto the beginning of the array
            blocks[x].unshift(new Block(colors[Math.floor(Math.random()*colors.length)]));
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

function setUpWorld(){
    addEmptyBlocks(2);  // add empty blocks at the bottom of the screen
    addBottomBlocks(5); // add blocks to bottom of screen, pushing them up
    fillEmpty();        // fill the rest of the grid with empty blocks
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
