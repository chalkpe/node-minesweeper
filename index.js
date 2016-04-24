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
        case 'e': toggleFlag(cursor); break;

        case 'w': cursor.w(); break;
        case 'd': cursor.d(); break;
        case 's': cursor.s(); break;
        case 'a': cursor.a(); break;

        default: if(key) switch(key.name){
            case 'up':    cursor.w(); break;
            case 'right': cursor.d(); break;
            case 'down':  cursor.s(); break;
            case 'left':  cursor.a(); break;
            default: return;
        }
    }

    printAll();
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
    type: FieldType.GROUND,
    flagged: false
})));

var toggleFlag = (x, y) => {
    if(x && x.hasOwnProperty('x')){
        y = x.y; x = x.x;
    }

    var field = fields[x][y];
    field.flagged = !field.flagged;

    printAll();
};

var buffer = '';

var write = (text) => buffer += text;
var flush = () => {
    process.stdout.write(buffer);
    buffer = '';
};

var clear = () => write('\033c');
var newLine = () => write('\n');

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

    newLine();
};

var blankColor = (mineCount) => {
    if(mineCount >= 7) return 'red';
    if(mineCount >= 5) return 'blue';
    if(mineCount >= 3) return 'yellow';
    else return 'black';
};

var getFieldString = (x, y) => {
    var field = fields[x][y];
    var output = {
        background: 'white', foreground: 'black', text: ' ', special: null
    };

    if(field.flagged){
        output.text = 'X';
        output.background = 'cyan';
    }

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

    var theChalk = chalk['bg' + capitalize(output.background)][output.foreground];
    if(output.special) theChalk = theChalk[output.special];

    return theChalk(output.text);
};

var printAll = () => {
    clear();
    printTitle(moment().toString());

    repeat(Border.COLOR, Border.TOP, cursor.x + 1);
    write(Border.SELECTION_COLOR(Border.TOP));
    repeat(Border.COLOR, Border.TOP, consoleWidth - cursor.x - 2);

    for(var y = 0; y < fieldHeight; y++){
        var border = (y === cursor.y ? Border.SELECTION_COLOR : Border.COLOR)(Border.CENTER);
        write(border); for(var x = 0; x < fieldWidth; x++) write(getFieldString(x, y)); write(border); newLine();
    }

    repeat(Border.COLOR, Border.BOTTOM, cursor.x + 1);
    write(Border.SELECTION_COLOR(Border.BOTTOM));
    repeat(Border.COLOR, Border.BOTTOM, consoleWidth - cursor.x - 2);

    flush();
};

var start = () => {
    var done = false;
    return () => {
        if(done) return false; done = true;

        var mineCount = (fieldWidth * fieldHeight) / 2;
        for(var i = 0; i < mineCount; i++) fields[random(fieldWidth)][random(fieldHeight)].type = FieldType.MINE;

        setInterval(printAll, 500);
        printAll();
        return true;
    };
}();

clear(); newLine(); printTitle('Press any key to start...'); flush();
