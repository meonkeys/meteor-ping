'use strict';

var _ = require('lodash');
var async = require('async');
var check = require('check-types');
var DDPClient = require('ddp');
var debugPkg = require('debug');

var ddpDebug = debugPkg('ddp');
var debug = debugPkg('MeteorPing');

var defaultConstructorArgs = {
  host: 'localhost',
  port: 3000,
  ssl: false,
  connectTimeout: 5 * 1000,
  subscribeTimeout: 5 * 1000,
  collection: 'meteor.loginServiceConfiguration',
};

function MeteorPing(args) {
  check.assert.maybe.object(args,
    'MeteorPing constructor args must be null, undefined, or a plain old object');
  var empty = _.omit(args, ['host', 'port', 'ssl', 'connectTimeout', 'subscribeTimeout', 'collection']);
  check.assert.emptyObject(empty, 'unexpected arg(s) passed to MeteorPing constructor');
  this.args = _.defaults(args, defaultConstructorArgs);
  // https://stackoverflow.com/a/106223/156060 has some better ideas for hostname checking
  check.assert.string(this.args.host,
    'host string passed to MeteorPing constructor must be a valid IP address or hostname');
  check.assert.inRange(this.args.port, 0, 65535,
    'port passed to MeteorPing constructor must be a valid port number');
  check.assert.boolean(this.args.ssl,
    'invalid ssl boolean passed to MeteorPing constructor');
  check.assert.greaterOrEqual(this.args.connectTimeout, 1,
    'connectTimeout milliseconds passed to MeteorPing constructor must be a number >= 1');
  check.assert.greaterOrEqual(this.args.subscribeTimeout, 1,
    'subscribeTimeout milliseconds passed to MeteorPing constructor must be a number >= 1');
  check.assert.string(this.args.collection,
    'collection parameter to MeteorPing constructor must be a string');
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
  debug('connect to ' + data.host + ':' + data.port + ', timeout ' + data.connectTimeout + 'ms');

  var callbackFired = false;
  var timeout = setTimeout(function() {
    callbackFired = true;
    var error = 'meteor-ping connect to ' + data.host + ':' + data.port + ' timed out after ' + data.connectTimeout + 'ms';
    callback(error, data);
  }, data.connectTimeout);

  data.ddpclient.connect(function(error, wasReconnect){
    if (callbackFired) {
      return;
    }
    if (error) {
      debug('connect got error: ' + error);
      callback(error, data);
    } else {

      if (wasReconnect) {
        // we should never get here when autoReconnect is false
        console.error('Unexpected condition: connection reestablished.');
      }

      debug('Connected to ' + data.host);

      clearTimeout(timeout);
      callback(null, data);
    }
  });
}

function subscribe(data, callback) {
  debug('subscribe to ' + data.collection);

  var callbackFired = false;
  var timeout = setTimeout(function() {
    callbackFired = true;
    var error = 'meteor-ping subscribe to ' + data.collection + ' timed out after ' + data.connectTimeout + 'ms for ' + data.host + ':' + data.port;
    callback(error, data);
  }, data.connectTimeout);

  data.ddpclient.subscribe(
    data.collection,
    [],
    function () {
      if (callbackFired) {
        return;
      }
      clearTimeout(timeout);
      callback(null, data);
    }
  );
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
    connect,
    subscribe,
    close,
  ], function(error, data) {
    debug('in waterfall callback');
    var elapsed = new Date().getTime() - data.startTime;
    var result = {elapsedTimeInMs: elapsed};
    callback(error, result);
  });
};

module.exports = MeteorPing;
module.exports.defaultConstructorArgs = defaultConstructorArgs;
