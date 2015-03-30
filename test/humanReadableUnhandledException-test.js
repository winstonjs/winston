/*
 * humanReadableUnhandledException-test.js: Test that stack trace is printed in human readable form when option is true.
 *
 * (C) 2015 Sam Zilverberg
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    winston = require('../lib/winston');

vows.describe('winston/transport/humanReadableUnhandledException').addBatch({
  "When humanReadableUnhandledException option is used": {
    "with memory transport": {
      topic: function () {
        var transport = new (winston.transports.Memory)({humanReadableUnhandledException: true});
        return this.callback(null, transport);
      },
      "should log the stack trace in a human readable form": function (_, transport) {
        var meta = {
          date: 'dummy date',
          process: 'dummy',
          os: 'dummy',
          trace: 'dummy',
          stack: ['first line','second line']
        };

        transport.log('info', 'stack:', meta, function (_, logged) {
          assert.ok(logged);
          assert.equal(1, transport.writeOutput.length);

          var msg = transport.writeOutput[0];
          assert.notEqual(-1, msg.indexOf('stack: date=dummy date, process=dummy, os=dummy\n'));
          assert.notEqual(-1, msg.indexOf(meta.stack[0] + '\n'));
        });
      }
    }
  }
}).export(module);
