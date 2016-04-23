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

    if(!start()) switch(ch) {
        case 'w': cursor.w(); break;
        case 'd': cursor.d(); break;
        case 's': cursor.s(); break;
        case 'a': cursor.a(); break;

        default: if(key) switch(key.name){
            case 'up':    cursor.w(); break;
            case 'right': cursor.d(); break;
            case 'down':  cursor.s(); break;
            case 'left':  cursor.a(); break;
        }
    }
});

var cursor = {
    x: 0, y: 0,
    w: () => cursor.y = Math.max(0, cursor.y - 1),
    d: () => cursor.x = Math.min(fieldWidth - 1, cursor.x + 1),
    s: () => cursor.y = Math.min(fieldHeight - 1, cursor.y + 1),
    a: () => cursor.x = Math.max(0, cursor.x - 1)
};

const FieldType = {
    GROUND: 0,
    BLANK: 1,
    MINE: 2
};

const Border = {
    TOP: '▄', BOTTOM: '▀', CENTER: '█', LEFT: '▐', RIGHT: '▌',
    COLOR: chalk.yellow,
    SELECTION_COLOR: chalk.yellow.bold
};

var consoleWidth = process.stdout.columns;
var consoleHeight = process.stdout.rows;

var fieldWidth = consoleWidth - 2;
var fieldHeight = consoleHeight - 3;

var fields = Array.apply(null, Array(fieldWidth)).map(() => Array.apply(null, Array(fieldHeight)).map(() => ({
    type: FieldType.BLANK,
    flagged: false
})));

var newLine = () => process.stdout.write('\n');
var write = (text, ln) => {
    process.stdout.write(text);
    if(ln) newLine();
};

var clear = () => write('\033c');
var repeat = (theChalk, text, count) => {
    for(var i = 0; i < count; i++) write(theChalk(text));
};

var capitalize = (str) => str && str.charAt(0).toUpperCase() + str.slice(1);

var random = (min, max) => {
    if(max === undefined){
        max = min; min = 0;
    }

    return min + Math.floor(Math.random() * (max - min));
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
    if(mineCount >= 5) return 'blue';
    if(mineCount >= 3) return 'yellow';
    else return 'black';
};

var getField = (x, y) => {
    var field = fields[x][y];
    var output = {
        background: 'white', foreground: 'black', text: ' '
    };

    if(field.flagged) output.background = 'magenta';
    else switch(field.type){
        case FieldType.GROUND:
        case FieldType.MINE:
            output.text = '?';
            output.background = 'black';
            break;

        case FieldType.BLANK:
            var xx, yy, count = 0;
            for(var i = -1; i <= 1; i++) for(var j = -1; j <= 1; j++) if((i !== 0 || j !== 0) && (xx = x + i) >= 0 && (yy = y + j) >= 0 && xx < fieldWidth && yy < fieldHeight && fields[xx][yy].type === FieldType.MINE) count++;

            output.foreground = blankColor(count);
            if(count > 0) output.text = Math.min(count, 9).toString(10);
            break;
    }

    if(cursor.x === x && cursor.y === y) output.background = 'green';
    return chalk['bg' + capitalize(output.background)][output.foreground](output.text);
};

var print = () => {
    clear();
    printTitle(moment().toString());

    repeat(Border.COLOR, Border.TOP, cursor.x + 1);
    write(Border.SELECTION_COLOR(Border.TOP));
    repeat(Border.COLOR, Border.TOP, consoleWidth - cursor.x - 2);

    for(var y = 0; y < fieldHeight; y++){
        write((y === cursor.y ? Border.SELECTION_COLOR : Border.COLOR)(Border.CENTER));
        for(var x = 0; x < fieldWidth; x++) write(getField(x, y));
        write((y === cursor.y ? Border.SELECTION_COLOR : Border.COLOR)(Border.CENTER));
    }

    repeat(Border.COLOR, Border.BOTTOM, cursor.x);
    write(Border.SELECTION_COLOR(Border.BOTTOM));
    repeat(Border.COLOR, Border.BOTTOM, consoleWidth - cursor.x - 1);
};

var start = () => {
    var done = false;
    return () => {
        if(done) return false; done = true;

        var mineCount = (fieldWidth * fieldHeight) / 2;
        for(var i = 0; i < mineCount; i++) fields[random(fieldWidth)][random(fieldHeight)].type = FieldType.MINE;

        setInterval(print, 500);
        return true;
    };
}();

clear(); newLine();
printTitle('Press any key to start...');
