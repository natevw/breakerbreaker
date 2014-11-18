var config = require("./config.js"),
    NORMAL_TIMEOUT = 10*60e1,
    ABUSED_TIMEOUT = 45e2,
    INFO_INTERVAL = 30e2,
    lastReceived = "TESTING";

var LineStream = require('linefeed'),
    fermata = require('fermata');
fermata.registerPlugin('twilio', function (transport, account_sid, auth_token) {
  this.base = "https://"+account_sid+":"+auth_token+"@api.twilio.com/2010-04-01/Accounts/"+account_sid;
  return transport.using('statusCheck').using('autoConvert', "application/x-www-form-urlencoded");
});
var twilAcct = fermata.twilio(config.TWILIO_SID, config.TWILIO_TOK);

var watchdog,
    mood = 'puppy',
    _req = null;
function _logMood() {
    console.log("%s | mood: %s.", new Date().toISOString(), mood)
}
function _restartWatchdog(snoozeTime) {
  if (_req) req.abort();
  clearTimeout(watchdog);
  watchdog = setTimeout(howl, snoozeTime);
}
function howl() {
  if (mood === 'happy') {
    console.warn("Ruhroh.");
    mood = 'unhappy';
    _restartWatchdog(NORMAL_TIMEOUT);
    _req = twilAcct('Messages').post({
      From: config.SRC_NUMBER,
      To: config.SMS_DEST,
      Body: "Trouble with power status. Last received: "+lastReceived
    }, handleTwilioResponse);
  } else {
    console.error("SUCH TROUBLE!!1!");
    _req = twilAcct('Calls').post({
      From: config.SRC_NUMBER,
      To: config.VOX_DEST,
      Url: config.VOX_URL
    }, handleTwilioResponse);
  }
  function handleTwilioResponse(e) {
    _req = null;
    if (e) throw e;
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
    lastReceived = line;
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
