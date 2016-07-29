# meteor-ping

Ping a [Meteor](https://www.meteor.com) app to confirm it is online.

## Synopsis

### Command-line use

```bash
npm install -g meteor-ping
meteor-ping --host=pingme.meteor.com --port=80
```

### API

```bash
npm install --save meteor-ping
```

```javascript
var MeteorPing = require('meteor-ping');
var localApp = new MeteorPing({
  host: 'localhost',
  port: 3000,
  ssl: false,
});

localApp.ping(function(error, result) {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    console.log('done. Milliseconds elapsed: ' + result.elapsedTimeInMs);
  }
});
```

## Description

Meteor apps deliver static content and layout. A websocket or long-polling
connection is used to deliver data. An app may return a HTTP 200 OK even if
data cannot be retrieved. It is helpful to have a smarter check
to ensure the static content **and** data are available.

The pinged app must use the [Accounts
system](https://docs.meteor.com/#/full/accounts_api).

## Compatibility

This package has been tested with Node.js version 0.10.46.

## Copyright, License

Copyright (C) 2016 Adam Monsen

MIT license.
