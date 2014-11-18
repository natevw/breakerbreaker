var LineStream = require('linefeed'),
    NORMAL_TIMEOUT = 10*60e1,
    ABUSED_TIMEOUT = 45e2,
    INFO_INTERVAL = 30e2;

var watchdog,
    mood = 'puppy';
function _logMood() {
    console.log("%s | mood: %s.", new Date().toISOString(), mood)
}
function _restartWatchdog(snoozeTime) {
  clearTimeout(watchdog);
  watchdog = setTimeout(howl, snoozeTime);
}
function howl() {
  if (mood === 'happy') {
    console.warn("Ruhroh.");
    mood = 'unhappy';
    _restartWatchdog(NORMAL_TIMEOUT);
  } else {
    console.error("SUCH TROUBLE!!1!");
  }
}

function feedFido() {
  mood = 'happy';
  _restartWatchdog(NORMAL_TIMEOUT);
}
function kickFido() {
  mood = 'testy';
  _restartWatchdog(ABUSED_TIMEOUT);
}
function dropFido() {
  // NOTE: I don't really know what this would indicate, but it is unexpected, so…
  clearTimeout(watchdog);
  mood = 'yucky';
  howl();
}

process.stdin.pipe(new LineStream({newline:"", objectMode:true})).on('data', function (line) {
    if (!/Received broadcast/.test(line)) return;
    var fields = line.split(" "),
        nc = +fields[9].split('=')[1];
    if (nc === 0) feedFido();
    else if (nc > 1024) /* neutral — remain waiting in current mood */;
    else if (nc > 300) kickFido();
}).on('end', function () {
    dropFido();
});

_logMood();
feedFido();
setInterval(_logMood, INFO_INTERVAL).unref();
