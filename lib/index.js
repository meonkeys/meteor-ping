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

function connect(data, callback) {
  debug('connect');
  data.ddpclient.connect(function(error, wasReconnect){
    if (error) {
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

function subscribe(data, callback) {
  debug('subscribe');
  data.ddpclient.subscribe(
    'meteor.loginServiceConfiguration',
    [],
    function () {
      callback(null, data);
    }
  );
}

function close(data, callback) {
  debug('close');
  data.ddpclient.close();
  callback(null, data);
}

MeteorPing.prototype.ping = function(callback) {
  debug('start');
  var startTime = new Date().getTime();
  async.waterfall([
    async.apply(setupDdp, this.args),
    connect,
    subscribe,
    close,
  ], function(error) {
    var elapsed = new Date().getTime() - startTime;
    callback(error, {elapsedTimeInMs: elapsed});
  });
};

module.exports = MeteorPing;
