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
  timeout: 10 * 1000,
  collection: 'meteor.loginServiceConfiguration',
};

function MeteorPing(args) {
  check.assert.maybe.object(args,
    'MeteorPing constructor args must be null, undefined, or a plain old object');
  var empty = _.omit(args, ['host', 'port', 'ssl', 'timeout', 'collection']);
  check.assert.emptyObject(empty, 'unexpected arg(s) passed to MeteorPing constructor');
  this.args = _.defaults(args, defaultConstructorArgs);
  // https://stackoverflow.com/a/106223/156060 has some better ideas for hostname checking
  check.assert.string(this.args.host,
    'invalid host passed to MeteorPing constructor (must be a valid IP address or hostname)');
  check.assert.inRange(this.args.port, 0, 65535,
    'invalid port passed to MeteorPing constructor (must be a valid port number)');
  check.assert.boolean(this.args.ssl,
    'invalid ssl option passed to MeteorPing constructor (must be boolean)');
  check.assert.greaterOrEqual(this.args.timeout, 1,
    'invalid timeout option passed to MeteorPing constructor (must be >= 1)');
  check.assert.string(this.args.collection,
    'invalid collection passed to MeteorPing constructor (must be a string)');
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
    console.error('meteor-ping timed out for ' + data.host);
    data.pingTimedOut = true;

    // This might cause callbacks to not fire, messing up execution flow (e.g.
    // our ability to return a proper error at the end of the waterfall)
    data.ddpclient.close();

    // Just setting pingTimedOut and checking for it later (and _not_ closing
    // the DDP connection) doesn't work with one specific failure condition:
    // calls to subscribe() hang (never call their callback). I'm seeing this
    // against one of my servers, but only when the collection I try to
    // subscribe to is meteor.loginServiceConfiguration

    // We can't throw an exception here -- it would be uncatchable because we
    // are async here.

    // A separate error handling callback might be better since it gives the
    // caller more control.
  }, data.timeout);
  callback(null, data);
}

function connect(data, callback) {
  debug('connect to ' + data.host + ':' + data.port);
  if (data.pingTimedOut) {
    debug('timed out before connect() -- will not attempt connection');
    callback(null, data);
  } else {
    data.ddpclient.connect(function(error, wasReconnect){
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
  debug('subscribe to ' + data.collection);
  if (data.pingTimedOut) {
    debug('timed out before subscribe() -- will not attempt subscription');
    callback(null, data);
  } else {
    // FIXME: getting stuck here sometimes when collection is meteor.loginServiceConfiguration
    data.ddpclient.subscribe(
      data.collection,
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
module.exports.defaultConstructorArgs = defaultConstructorArgs;
