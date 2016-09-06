#!/usr/bin/env node

'use strict';

var MeteorPing = require('./lib/index.js');
var yargs = require('yargs');

var argv = yargs
  .usage('Usage: $0 [options]')
  .boolean(['ssl'])
  .default(MeteorPing.defaultConstructorArgs)
  .help('h')
  .alias('h', 'help')
  .argv;

var x = new MeteorPing({
  host: argv.host,
  port: argv.port,
  ssl: argv.ssl,
  timeout: argv.timeout,
  collection: argv.collection,
});

x.ping(function(error, result) {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    console.log(result.elapsedTimeInMs);
  }
});
