'use strict';

var MeteorPing = require('./lib/index.js');
var yargs = require('yargs');

var argv = yargs
  .usage('Usage: $0 [options]')
  .boolean(['ssl'])
  .default({
    host: 'localhost',
    port: 3000,
    ssl: false
  })
  .help('h')
  .alias('h', 'help')
  .argv;

var x = new MeteorPing({
  host: argv.host,
  port: argv.port,
  ssl: argv.ssl,
});

x.ping(function(error, result) {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    console.log('done. Milliseconds elapsed: ' + result.elapsedTimeInMs);
  }
});
