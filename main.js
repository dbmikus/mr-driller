// Global variables
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var blockcolumns = 7;
var blocks=[];
for(i=0;i<blockcolumns;i++){
    blocks.push([]);
}

function main() {
    setUpWorld();
    drawDisplay();
}

function Driller(column,row) {
    this.column = column;
    this.row = row;

    this.move = function (dx, dy) {
        this.xPos += dx;
        this.yPos += dy;
    }
}


function addBottomBlocks(depth){
    for(d=0; d<depth; d++){
        for(x=0; x<7;x++){
            blocks[x].unshift(Math.floor(Math.random()*4));
        }
    }
    return blocks;
}
function setUpWorld(){
    addBottomBlocks(5);
    driller = new Driller(3,6);
}





//graphics

function drawScoreboard(width, height) {
    ctx.beginPath();
    ctx.moveTo(canvas.width - width, 0);
    // Drawing vertical divider line
    ctx.lineTo(canvas.width - width, height);
    ctx.stroke();
}

function drawBlocks(){
    for(column=0;column<blockcolumns;column++){
        for(index=0; index<blocks[column].length;index++){
            drawBlock(column,index,blocks[column][index]);
        }
    }
}

function drawDriller(){
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(driller.column*60+30, canvas.height- driller.row*60+90, 29, 0, 2*Math.PI, true);
    ctx.fill();
}

function drawWorld() {
    reset();
    drawBlocks();
    drawDriller();
}


function drawDisplay() {
    worldWidth = 420;
    drawScoreboard(canvas.width - worldWidth, canvas.height);
    drawWorld();
}

function drawBlock(column,row,color){
    if(color===0)
        ctx.fillStyle = "blue";
    else if(color===1)
        ctx.fillStyle = "green";
    else if(color===2)
        ctx.fillStyle = "red";
    else if(color===3)
        ctx.fillStyle = "purple";
    var hasAdjacent = false;
    if(column>0 && blocks[column-1][row]===color){
        drawRoundedRectangle(ctx,(column-1)*60+5,canvas.height-index*60+5,
            110,50,5,color);
        hasAdjacent =true;
    }
    if(row>0 && blocks[column][row-1]===color){
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
