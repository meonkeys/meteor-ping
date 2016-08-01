'use strict';

var assert = require('chai').assert;
var MeteorPing = require('../lib/index.js');

describe('Setup', function() {
  describe('init', function() {
    it('should return a properly initialized MeteorPing object', function() {
      var m = new MeteorPing();
      assert.equal(m.args.host, 'localhost');
    });

    it('rejects unexpected constructor args', function() {
      function testThrow() {
        new MeteorPing({password: 'blah'});
      }
      assert.throws(testThrow,
        'unexpected arg(s) passed to MeteorPing constructor');
    });
  });
});

// - pseudo-e2e test with a 1ms timeout
describe('Ping', function() {
  describe('simple attempt', function() {
    it('no errors on ping attempt and calls callback', function(done) {
      var m = new MeteorPing({timeout: 1});
      m.ping(function() {
        // discard error & result
        done();
      });
    });
  });
});

// TODO: add e2e test, with minimal local meteor app (ideally several... one
// with slow publications)
