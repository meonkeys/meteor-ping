# meteor-ping

[![Build Status](https://travis-ci.org/meonkeys/meteor-ping.svg?branch=master)](https://travis-ci.org/meonkeys/meteor-ping)

Ping a [Meteor](https://www.meteor.com) app to confirm it is online. This is a "DDP ping", using a Meteor-specific test (subscribing to a collection) to determine if an app is online and measure the response time.

Timing is done internally to adjust for Node.js startup time.

## Synopsis

### Command-line use

```bash
npm install -g meteor-ping
meteor-ping --host=pingme.meteor.com --port=80
```

Upon failure, a message is printed to standard error and the program exits with an error code.

Upon success, the milliseconds elapsed for the ping is printed to standard output.

### API

```bash
npm install --save meteor-ping
```

```javascript
'use strict';

var MeteorPing = require('meteor-ping');

// all args are optional, here are the defaults
var localApp = new MeteorPing({
  host: 'localhost',
  port: 3000,
  ssl: false,
  timeout: 10 * 1000, // 10 seconds
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

### MeteorPing constructor arguments

All arguments are optional.

1. `host` - domain name of Meteor server to ping. Must be a valid IP address or hostname.
    * Default `localhost`.
1. `port` - port of Meteor server to ping. Must be a valid port number.
    * Default `3000`.
1. `ssl` - whether to use SSL for the connection. Boolean. Automatically `true` if `port` is `443` (no idea why).
    * Default `false`.
1. `timeout` - milliseconds before timing out the ping attempt. Must be a number greater than or equal to 1. **Warning** this does not abort execution, but tries to prevent any further action in `MeteorPing`. Someday timing out may throw an exception.
    * Default `10000`.
1. `collection` - collection to use for `subscribe()` call during DDP ping test. Must be a string. Consider using a database-backed collection if you have one--this provides a full round-trip ping.
    * Default `meteor.loginServiceConfiguration`.

## Description

Meteor apps deliver static content and layout. A websocket or long-polling connection is used to deliver data. An app may return a HTTP 200 OK even if data cannot be retrieved. It is helpful to have a smarter check to ensure the static content **and** data are available.

The pinged app must use the [Accounts system](https://docs.meteor.com/#/full/accounts_api) or must override the `collection` constructor argument.

## Compatibility

This package has been tested with Node.js version 0.10.46.

## Copyright, License

Copyright (C) 2016 Adam Monsen

MIT license.
