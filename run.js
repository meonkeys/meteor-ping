#!/usr/bin/env node

'use strict';

const MeteorPing = require('./lib/index.js');
const yargs = require('yargs');

const argv = yargs
  .usage('Usage: $0 [options]')
  .boolean(['ssl'])
  .default(MeteorPing.defaultConstructorArgs)
  .help('h')
  .alias('h', 'help')
  .argv;

const x = new MeteorPing({
  host: argv.host,
  port: argv.port,
  ssl: argv.ssl,
  connectTimeout: argv.connectTimeout,
  subscribeTimeout: argv.subscribeTimeout,
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
