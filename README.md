# breakerbreaker

Requesting a wake up call the next time the outside GFCI breaker "nuisance trips" and tries to freeze the plants/fish in my greenhouse, etc.

Requires an account with <https://twilio.com>. Processes log output from <https://github.com/natevw/greenhouse>.

Approximate usage:

    npm install
    cp config.example.js config.js
    vi config.js    # add your Twilio credentials/numbers
    tail -n 0 -f green.log | node watcher.node.js
