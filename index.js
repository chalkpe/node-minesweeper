var chalk = require('chalk');
var moment = require('moment');
var keypress = require('keypress');

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('keypress', function(ch, key){
    if(key && key.ctrl && key.name === 'c'){
        process.stdin.pause();
        process.exit(1);
    }
});

const FieldType = {
    GROUND: 0,
    BLANK: 1,
    MINE: 2
};

const Border = {
    HORIZONTAL: '━',
    VERTICAL: '┃',
    TOP_LEFT: '┏',
    TOP_RIGHT: '┓',
    BOTTOM_LEFT: '┗',
    BOTTOM_RIGHT: '┛',
    COLOR: chalk.yellow
}

var consoleWidth = process.stdout.columns;
var consoleHeight = process.stdout.rows;

var fieldWidth = consoleWidth - 4;
var fieldHeight = consoleHeight - 3;

var fields = Array.apply(null, Array(fieldWidth)).map(() => Array.apply(null, Array(fieldHeight)).map(() => FieldType.GROUND));

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

var random = (min, max) => {
    if(max === undefined){
        max = min; min = 0;
    }

    return min + Math.floor(Math.random() * (max - min));
};

var print = () => {
    clear();
    printTitle(moment().toString());

    write(Border.COLOR(Border.TOP_LEFT));
    repeat(Border.COLOR, Border.HORIZONTAL, consoleWidth - 2);
    write(Border.COLOR(Border.TOP_RIGHT));

    for(var y = 0; y < fieldHeight; y++){
        write(Border.COLOR(Border.VERTICAL + ' '));
        for(var x = 0; x < fieldWidth; x++) write('' + random(10));
        write(Border.COLOR(' ' + Border.VERTICAL));
    }

    write(Border.COLOR(Border.BOTTOM_LEFT));
    repeat(Border.COLOR, Border.HORIZONTAL, consoleWidth - 2);
    write(Border.COLOR(Border.BOTTOM_RIGHT));
};

setInterval(print, 500);
