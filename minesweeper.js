#!/usr/bin/env node

var argv = require('yargs').argv;
var chalk = require('chalk');
var moment = require('moment');
var keypress = require('keypress');

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('keypress', (ch, key) => {
    if(key && key.ctrl && key.name === 'c'){
        clear(); flush();
        process.stdin.pause();
        process.exit(1);
    }

    if(game.status <= Status.READY) start(); else if(game.status === Status.STARTED) switch(ch){
        case 'e': toggleFlag(cursor); break;
        case 'q': uncoverField(cursor); break;

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

process.stdout.on('resize', () => {
    clear(); printAll();
});

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

var isNumeric = (x) => !isNaN(parseFloat(x)) && isFinite(x);

var consoleWidth = () => process.stdout.columns;
var consoleHeight = () => process.stdout.rows;

var fieldWidth = Math.min(2048, isNumeric(argv.x) ? parseFloat(argv.x) : consoleWidth() - 2);
var fieldHeight = Math.min(2048, isNumeric(argv.y) ? parseFloat(argv.y) : consoleHeight() - 3);

var fields = Array.apply(null, Array(fieldWidth)).map((v, x) => Array.apply(null, Array(fieldHeight)).map((v, y) => ({
    x: x, y: y,
    type: FieldType.GROUND,
    flagged: false
})));

var flatFields = () => fields.reduce((a, b) => a.concat(b));

var cursor = {
    x: Math.floor(fieldWidth / 2),
    y: Math.floor(fieldHeight / 2),
    w: () => cursor.y = Math.max(0, cursor.y - 1),
    d: () => cursor.x = Math.min(fieldWidth - 1, cursor.x + 1),
    s: () => cursor.y = Math.min(fieldHeight - 1, cursor.y + 1),
    a: () => cursor.x = Math.max(0, cursor.x - 1)
};

const Status = {
    READY: 0,
    STARTED: 1,
    FAILED: 2,
    SUCCEEDED: 3
};

var game = {
    status: Status.READY,
    startedTime: null,
    finishedTime: null,

    flagCount: 0,
    mineCount: Math.floor((fieldWidth * fieldHeight) / 100 * Math.min(50, isNumeric(argv._[0]) ? parseFloat(argv._[0]) : 15)),
    mineInstalled: false,
};

var vectorToField = (x, y) => {
    if(x && x.hasOwnProperty('x')){
        y = x.y; x = x.x;
    }

    return (fields[x] && fields[x][y]) || null;
};

var toggleFlag = (x, y) => {
    var field = vectorToField(x, y); if(!field) return;
    if(field.type === FieldType.BLANK) return;

    if(field.flagged = !field.flagged) game.flagCount++; else game.flagCount--;
    if(game.flagCount === game.mineCount && flatFields().filter(field => field.flagged).every(field => field.type === FieldType.MINE)) return finish(true);

    printAll();
};

var walkAround = (field, callback) => {
    var xx, yy; for(var i = -1; i <= 1; i++) for(var j = -1; j <= 1; j++) if((i || j) && (xx = field.x + i) >= 0 && (yy = field.y + j) >= 0 && xx < fieldWidth && yy < fieldHeight && callback(fields[xx][yy])) return;
};

var mineCount = (x, y) => {
    var field = vectorToField(x, y); if(!field) return;

    var count = 0; walkAround(field, (f) => {
        if(f.type === FieldType.MINE) count++;
    });

    return count;
};

var uncoverField = (x, y) => {
    var field = vectorToField(x, y); if(!field || field.flagged) return;
    if(!game.mineInstalled){
        game.mineInstalled = true;

        var exception = {}; exception[field.x + ':' + field.y] = true;
        randomVectorArray(game.mineCount, exception).forEach((vector) => fields[vector[0]][vector[1]].type = FieldType.MINE);
    }

    switch(field.type){
        case FieldType.MINE:
            finish(false);
            break;

        case FieldType.GROUND:
            field.type = FieldType.BLANK;

            uncoverGround(field.x, field.y - 1); //w
            uncoverGround(field.x + 1, field.y); //d
            uncoverGround(field.x, field.y + 1); //s
            uncoverGround(field.x - 1, field.y); //a
            break;

        default: return;
    }
};

var uncoverGround = (x, y) => {
    var queue = [vectorToField(x, y)];
    var check = {}, blanks = [];

    while(queue.length > 0){
        var field = queue.shift();
        if(!field || field.type !== FieldType.GROUND) continue;

        var key = field.x + ':' + field.y;
        if(check[key]) continue; check[key] = true;

        if(mineCount(field) !== 0) continue;
        field.type = FieldType.BLANK; blanks.push(field);

        queue.push(vectorToField(field.x, field.y - 1)); //w
        queue.push(vectorToField(field.x + 1, field.y)); //d
        queue.push(vectorToField(field.x, field.y + 1)); //s
        queue.push(vectorToField(field.x - 1, field.y)); //a
    }

    blanks.forEach((field) => walkAround(field, (f) => {
        if(f.type === FieldType.GROUND) f.type = FieldType.BLANK;
    }));
};

var buffer = '';

var write = (text) => buffer += text;
var flush = () => {
    process.stdout.write(buffer);
    buffer = '';
};

var clear = () => write('\033c');
var newLine = () => write('\n');
var moveCursor = (n, m) => write('\033[' + [n, m].map(i => i || '1').join(';') + 'H');

var repeat = (theChalk, text, count) => {
    for(var i = 0; i < count; i++) theChalk ? write(theChalk(text)) : write(text);
};

var capitalize = (str) => str && str.charAt(0).toUpperCase() + str.slice(1);

var random = (min, max) => {
    if(max === undefined){
        max = min; min = 0;
    }

    return min + Math.floor(Math.random() * (max - min));
};

var randomVectorArray = (count, exception) => {
    var check = {};
    var vectors = [];

    while(vectors.length < count){
        var vector = [random(fieldWidth), random(fieldHeight)]; var key = vector.join(':');
        if(!check[key] && !exception[key]){
            check[key] = true;
            vectors.push(vector);
        }
    }
    return vectors;
};

const Title = {
    COLOR: chalk.yellow.bold
};

var printTitle = (text, align) => {
    var spaces = consoleWidth() - text.length;

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

var blankColor = (count) => {
    if(count >= 7) return 'red';
    if(count >= 5) return 'blue';
    if(count >= 3) return 'yellow';
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
            var count = mineCount(x, y);
            output.foreground = blankColor(count);
            if(count > 0) output.text = Math.min(count, 9).toString(10);
            break;
    }

    if(cursor.x === x && cursor.y === y) output.background = 'green';

    if(game.status > Status.STARTED && field.type === FieldType.MINE){
        output.text = '!';
        output.foreground = 'white';
        output.special = 'bold';

        if(!field.flagged) output.background = 'red';
    }

    var theChalk = chalk['bg' + capitalize(output.background)][output.foreground];
    if(output.special) theChalk = theChalk[output.special];

    return theChalk(output.text);
};

var getElapsedTime = (now) => moment.utc((now || moment()).diff(game.startedTime)).format("HH:mm:ss");

var printAll = (title) => {
    moveCursor();

    var marginTop = Math.floor((consoleHeight() - fieldHeight - 3) / 2);
    var marginLeft = Math.round((consoleWidth() - fieldWidth - 2) / 2);

    repeat(null, '\n', marginTop);

    switch(game.status){
        case Status.READY:
            printTitle("Press any key to start...");
            break;

        case Status.STARTED:
            var title = getElapsedTime() + ' | ' + game.flagCount + '/' + game.mineCount;
            var cursorText = ' | (' + cursor.x + ', ' + cursor.y + ')';
            printTitle((title.length + cursorText.length) < consoleWidth() ? title + cursorText : title);
            break;

        case Status.FAILED:
            printTitle(getElapsedTime(game.finishedTime) + ' | ' + game.mineCount + " | Failed");
            break;

        case Status.SUCCEEDED:
            printTitle(getElapsedTime(game.finishedTime) + ' | ' + game.mineCount + " | Succeeded");
            break;
    }

    repeat(null, ' ', marginLeft);
    repeat(Border.COLOR, Border.TOP, cursor.x + 1);
    write(Border.SELECTION_COLOR(Border.TOP));
    repeat(Border.COLOR, Border.TOP, fieldWidth - cursor.x);
    newLine();

    for(var y = 0; y < fieldHeight; y++){
        var border = (y === cursor.y ? Border.SELECTION_COLOR : Border.COLOR)(Border.CENTER);
        repeat(null, ' ', marginLeft); write(border); for(var x = 0; x < fieldWidth; x++) write(getFieldString(x, y)); write(border); newLine();
    }

    repeat(null, ' ', marginLeft); repeat(Border.COLOR, Border.BOTTOM, cursor.x + 1);
    write(Border.SELECTION_COLOR(Border.BOTTOM));
    repeat(Border.COLOR, Border.BOTTOM, fieldWidth - cursor.x);

    flush();
};

var printer = null;

var start = () => {
    if(game.status > Status.READY) return;

    game.status = Status.STARTED;
    game.startedTime = moment();

    printAll();
};

var finish = (succeeded) => {
    if(game.status > Status.STARTED) return;

    game.status = succeeded ? Status.SUCCEEDED : Status.FAILED;
    game.finishedTime = moment();

    printAll();
    setTimeout(() => {
        newLine(); flush();
        process.exit(0);
    }, 3000);
};

game.status = Status.READY; clear(); printAll();
printer = setInterval(printAll, 200);
