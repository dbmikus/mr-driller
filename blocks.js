// Contains block functions, but no global variables

// Block object
// The state parameter is optional
// Block states are:
//   stationary
//   shaking
//   falling
function Block(type, state){
    var countdownFactor = 3;

    //string describing the content of the block
    this.type = type;

    if (state === undefined) {
        state = "stationary";
    }
    this.state = state;
    this.countdown = countdownFactor;

    // Pixel offsets used for animations
    this.xOffset = 0;
    this.yOffset = 0;

    this.changeState = function (newState) {
        this.countdown = countdownFactor;
        this.state = newState;
    }
}

// Given a position and a type of block, recursively finds a connected group of
// blocks of that type starting at that position.
// Returns an array of points, with a point for each block in the group
function getBlockGroup(blocks, x, y, blockType) {
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

function blockGravity(blocks) {
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
                var groupList = getBlockGroup(blocks, x, y, blocks[x][y].type);

                // If the group can fall, add it to the list of falling
                // groups, which we will move at the end of the block
                // gravity loop.
                // This adds the group to the checkedGrid
                checkedGrid = (groupFalls(blocks, checkedGrid, groupList));
            }
        }
    }

    blocks = blockGravityMove(blocks, checkedGrid);
    return {"statusGrid": checkedGrid, "blockGrid": blocks};
}

// Move all blocks that fall down by one.
// If they are on the bottom and are falling, just forget about them. This
// should only happen to empty blocks on the bottom row, which I'm pretty
// sure we won't spawn, but it's better to be safe than sorry.
// We start on the second row because the bottom row cannot move down
// any further.
// We start at the bottom and work our way up so we do not overwrite
// anything.
function blockGravityMove(blocks, checkedGrid) {
    for (y=1; y<maxRows; y++) {
        for(x=0; x<blockcolumns; x++) {
            // Empty blocks only fall downwards if they are falling into a space
            // that will become empty.
            // TODO There might be a cleaner way to do this.
            if (checkedGrid[x][y] === "falls") {
                if (blocks[x][y].type === "empty") {
                    if (checkedGrid[x][y-1] === "falls") {
//                        blocks[x][y-1] = blocks[x][y];
                    }
                }
                // The block is not an empty block
                else {
                    if (blocks[x][y].state === "stationary") {
                        blocks[x][y].changeState("shaking");
                    }
                    else if (blocks[x][y].state === "shaking") {
                        if (blocks[x][y].countdown === 0) {
                            blocks[x][y].changeState("falling");
                        } else {
                            blocks[x][y].countdown -= 1;
                        }
                    }
                    else if (blocks[x][y].state === "falling") {
                        if (blocks[x][y].countdown === 0) {
                            // call this to reset countdown
                            blocks[x][y].changeState("falling");
                            blocks[x][y-1] = blocks[x][y];
                            blocks[x][y] = new Block("empty");
                        } else {
                            blocks[x][y].countdown -= 1;
                        }
                    }
                    // If something would fall into the top row, just make it
                    // empty. This way we don't have a forever falling column
                    if (y === maxRows-1 || checkedGrid[x][y+1] === "stays") {
//                        blocks[x][y] = new Block("empty");
                    }
                }
            }
            // The block does not fall, set its state to stationary
            else {
                // If the block was falling, it has the potential to fall into a
                // group causing that group to become of size >= to 4
                if (blocks[x][y].state === "falling") {
                    var group = getBlockGroup(blocks, x, y, blocks[x][y].type);
                    // If the group size is >= 4, delete the group
                    // TODO increase player score?
                    if (group.length >= 4) {
                        group.forEach(function (point) {
                            blocks[point.x][point.y] = new Block("empty");
                        });
                    }
                    // Otherwise, the block just becomes stationary
                    else {
                        blocks[x][y].changeState("stationary");
                    }
                }
                // Redundant possibly, but block becomes stationary
                else {
                    blocks[x][y].changeState("stationary");
                }
            }
        }
    }

    return blocks;
}

// Expects a valid block grouping.
// Checks that every block in the group is capable of falling one square.
// Returns true if that is the case.
function groupFalls(blocks, checkedGrid, groupList) {
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
            checkedGrid = groupFalls(blocks,
                                     checkedGrid,
                                     getBlockGroup(blocks, p.x, p.y-1,
                                                   blocks[p.x][p.y-1].type));

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
