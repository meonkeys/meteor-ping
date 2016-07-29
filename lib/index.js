'use strict';

var async = require('async');
var DDPClient = require('ddp');
var debugPkg = require('debug');

var ddpDebug = debugPkg('ddp');
var debug = debugPkg('MeteorPing');

function MeteorPing(args) {
  this.args = args;
}

function setupDdp(data, callback) {
  debug('setupDdp');
  data.ddpclient = new DDPClient({
    host: data.host,
    port: data.port,
    ssl: data.ssl,
    autoReconnect: false, // only re-connects, doesn't re-try first connect
    maintainCollections: true,
    ddpVersion: '1',
  });

  data.ddpclient.on('message', function (msg) {
    ddpDebug('DDP message: ' + msg);
  });

  data.ddpclient.on('socket-close', function(code, message) {
    ddpDebug('Socket closed. code=' + code + ' message=' + message);
  });

  data.ddpclient.on('socket-error', function(error) {
    ddpDebug('Socket error: ' + error.message);
  });

  callback(null, data);
}

function setupTimeout(data, callback) {
  debug('setupTimeout');
  debug('ping will timeout in ' + data.timeout + 'ms');
  data.pingTimeout = setTimeout(function() {
    debug('pingTimeout fired');
    data.pingTimedOut = true;
    // originally I tried ddpclient.close() here, but that causes callbacks to
    // not fire, messing up execution flow (e.g. returning a proper error at
    // the end of the waterfall)
  }, data.timeout);
  callback(null, data);
}

function connect(data, callback) {
  debug('connect');
  if (data.pingTimedOut) {
    debug('timed out before connect() -- will not attempt connection');
    callback(null, data);
  } else {
    data.ddpclient.connect(function(error, wasReconnect){
      // if pingTimeout fires, this callback will never fire
      if (error) {
        debug('connect got error: ' + error);
        callback(error, data);
      } else {

        if (wasReconnect) {
          // we should never get here when autoReconnect is false
          console.error('Unexpected condition: connection reestablished.');
        }

        debug('Connected to ' + data.host);

        callback(null, data);
      }
    });
  }
}

function subscribe(data, callback) {
  debug('subscribe');
  if (data.pingTimedOut) {
    debug('timed out before subscribe() -- will not attempt subscription');
    callback(null, data);
  } else {
    data.ddpclient.subscribe(
      'meteor.loginServiceConfiguration',
      [],
      function () {
        callback(null, data);
      }
    );
  }
}

function close(data, callback) {
  debug('close');
  if (data.ddpclient.socket) {
    data.ddpclient.close();
  }
  callback(null, data);
}

MeteorPing.prototype.ping = function(callback) {
  debug('start');
  this.args.startTime = new Date().getTime();
  async.waterfall([
    async.apply(setupDdp, this.args),
    setupTimeout,
    connect,
    subscribe,
    close,
  ], function(error, data) {
    debug('in waterfall callback. Clearing pingTimeout.');
    clearTimeout(data.pingTimeout);

    var elapsed = new Date().getTime() - data.startTime;
    var result = {elapsedTimeInMs: elapsed};

    if (error) {
      callback(error, result);
    } else if (data.pingTimedOut) {
      callback('timed out', result);
    } else {
      callback(null, result);
    }
  });
};

module.exports = MeteorPing;
