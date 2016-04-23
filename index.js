var chalk = require('chalk');

var keypress = require('keypress');
keypress(process.stdin);

process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('keypress', function(ch, key){
    if(key && key.ctrl && key.name === 'c') process.stdin.pause();

});

var fields = Array.apply(null, Array(process.stdout.columns)).map(() => Array.apply(null, Array(process.stdout.rows)));
var clear = () => process.stdout.write('\033c');

for(var y = 0; y < process.stdout.rows; y++){
    for(var x = 0; x < process.stdout.columns; x++){
        process.stdout.write((x + y) % 2 ? '_' : '-');
    }
}

setTimeout(clear, 5000);
