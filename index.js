var chalk = require('chalk');
var moment = require('moment');
var keypress = require('keypress');

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('keypress', (ch, key) => {
    if(key && key.ctrl && key.name === 'c'){
        process.stdin.pause();
        process.exit(1);
    }

    start();
    switch(ch) {
        case 'a': cursor.x = Math.max(0, cursor.x - 1); break;
        case 'd': cursor.x = Math.min(fieldWidth - 1, cursor.x + 1); break;
        case 'w': cursor.y = Math.max(0, cursor.y - 1); break;
        case 's': cursor.y = Math.min(fieldHeight - 1, cursor.y + 1); break;
    }
});

const FieldType = {
    GROUND: 0,
    BLANK: 1,
    MINE: 2
};

const Border = {
    TOP: '▄', BOTTOM: '▀', FULL: '█',
    COLOR: chalk.yellow
};

var consoleWidth = process.stdout.columns;
var consoleHeight = process.stdout.rows;

var fieldWidth = consoleWidth - 2;
var fieldHeight = consoleHeight - 3;

var fields = Array.apply(null, Array(fieldWidth)).map(() => Array.apply(null, Array(fieldHeight)).map(() => ({
    type: FieldType.BLANK,
    flagged: false
})));

var cursor = {
    x: 0, y: 0
}

var newLine = () => process.stdout.write('\n');
var write = (text, ln) => {
    process.stdout.write(text);
    if(ln) newLine();
};

var clear = () => write('\033c');
var repeat = (theChalk, text, count) => {
    for(var i = 0; i < count; i++) write(theChalk(text));
};

const Title = {
    COLOR: chalk.yellow.bold
};

var printTitle = (text, align) => {
    var spaces = consoleWidth - text.length;

    switch(align){
        case 'left':
            write(Title.COLOR(text));
            repeat(Title.COLOR, ' ', spaces);
            break;

        default:
        case 'center':
            var leftSpaces = Math.floor(spaces / 2);
            repeat(Title.COLOR, ' ', leftSpaces);
            write(Title.COLOR(text));
            repeat(Title.COLOR, ' ', spaces - leftSpaces);
            break;

        case 'right':
            repeat(Title.COLOR, ' ', spaces);
            write(Title.COLOR(text));
            break;
    }

    process.stdout.write('\n');
};

var blankColor = (mineCount) => {
    if(mineCount >= 7) return 'red';
    if(mineCount >= 5) return 'cyan';
    if(mineCount >= 3) return 'yellow';
    else return 'black';
};

var getField = (x, y) => {
    var field = fields[x][y];
    if(field.flagged) return chalk.bgMagenta(' ');

    switch(field.type){
        case FieldType.GROUND:
        case FieldType.MINE:
            return chalk.bgBlack(' ');

        case FieldType.BLANK:
            var xx, yy, count = 0;
            for(var i = -1; i <= 1; i++) for(var j = -1; j <= 1; j++) if((i !== 0 || j !== 0) && (xx = x + i) >= 0 && (yy = y + j) >= 0 && xx < fieldWidth && yy < fieldHeight && fields[xx][yy].type === FieldType.MINE) count++;

            var color = blankColor(count);
            return chalk.bgWhite[color](count > 0 ? Math.min(count, 9).toString(10) : ' ');
    }
};

var random = (min, max) => {
    if(max === undefined){
        max = min; min = 0;
    }

    return min + Math.floor(Math.random() * (max - min));
};

var print = () => {
    clear();
    printTitle(moment().toString());

    repeat(Border.COLOR, Border.TOP, consoleWidth);
    for(var y = 0; y < fieldHeight; y++){
        write(Border.COLOR(Border.FULL));
        for(var x = 0; x < fieldWidth; x++) write(getField(x, y));
        write(Border.COLOR(Border.FULL));
    }
    repeat(Border.COLOR, Border.BOTTOM, consoleWidth);
};

var start = () => {
    var done = false;
    return () => {
        if(done) return; done = true;

        var mineCount = (fieldWidth * fieldHeight) / 20;
        for(var i = 0; i < mineCount; i++) fields[random(fieldWidth)][random(fieldHeight)].type = FieldType.MINE;

        setInterval(print, 500);
    };
}();

clear(); newLine();
printTitle('Press any key to start...');
