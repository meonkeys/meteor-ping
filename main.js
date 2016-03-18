#!/usr/bin/env node

'use strict';

var Promise = require('promise-polyfill');
var DDPClient = require('ddp');
var debugPkg = require('debug');
var yargs = require('yargs');

var argv = yargs
  .usage('Usage: $0 [options]')
  .boolean(['noRetry', 'ssl'])
  .default({
    noRetry: false,
    retryInterval: 2000, // milliseconds
    maxRetries: 60,
    host: 'localhost',
    port: 3000,
    ssl: false
  })
  .help('h')
  .alias('h', 'help')
  .argv;

var debug = debugPkg('upcheck');
debug('start');

var ddpclient = new DDPClient({
  host: argv.host,
  port: argv.port,
  ssl: argv.ssl,
  autoReconnect: false, // only re-connects, doesn't re-try first connect
  maintainCollections: true,
  ddpVersion: '1',
});

ddpclient.on('message', function (msg) {
  debug('DDP message: ' + msg);
});

ddpclient.on('socket-close', function(code, message) {
  debug('Socket closed. code=' + code + ' message=' + message);
});

ddpclient.on('socket-error', function(error) {
  debug('Socket error: ' + error.message);
});

var retries = 0;
function connect() {
  return new Promise(function(resolve, reject) {
    ddpclient.connect(function(error, wasReconnect){
      if (error) {
        ddpclient.close();
        if (!argv.noRetry && (retries < argv.maxRetries)) {
          debug('retry ' + (retries + 1) + ' of ' + argv.maxRetries);
          retries++;
          setTimeout(function() {
            connect().then(function() {
              resolve();
            }); // should we have a catch here?
          }, argv.retryInterval);
        } else {
          reject(new Error('connection to ' + argv.host + ':' + argv.port + ' failed and exceeded maxRetries'));
          return;
        }
      } else {
        if (wasReconnect) {
          // we should never get here when autoReconnect is false
          reject('Unexpected condition: connection reestablished.');
          return;
        }
        resolve();
      }
    });
  });
}

function subscribe() {
  return new Promise(function(resolve, reject) {
    ddpclient.subscribe(
      'meteor.loginServiceConfiguration',
      [],
      function () {
        resolve();
      }
    );
  });
}

connect()
  .then(subscribe)
  .then(function() {
    console.log(argv.host + ':' + argv.port + ' is ready.');
    ddpclient.close();
    debug('end');
    process.exit(0);
  })
  .catch(function(reason) {
    // specific error provided by ddpclient socket-error emitter
    if (reason) {
      console.error(reason);
    } else {
      console.error('Abort.');
    }
    debug('end, with errors');
    process.exit(1);
  });

// vim: ft=javascript
