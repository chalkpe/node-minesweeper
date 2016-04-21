require('keypress')(process.stdin);

process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('keypress', function(ch, key){
    if(key && key.ctrl && key.name === 'c') process.stdin.pause();
    process.stdout.write(ch);
});
