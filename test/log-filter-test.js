/* log-filter-test.js: Test filtering of message content in winston.
 * (c) 2015 Chris Oloff
 * MIT LICENSE
 */

var assert = require('assert'),
    vows = require('vows'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

/* To demo a filter, we filter out credit card numbers, assuming that a credit
 * card number consists of 13 or more digits (without spaces). This function
 * does the actual masking.
 */
function maskCardNumbers(s) {
  var match;
  while (match = s.match(/(\d{13}\d*)/)) {
    var toBeMasked = match[1];
    s = s.replace(toBeMasked, toBeMasked.substring(0,6) + '****' + toBeMasked.substring(toBeMasked.length - 4));
  }
  return s;
}

vows.describe('winston/logger/filter').addBatch({
  "An instance of winston.Logger": {
    topic: new (winston.Logger)({transports: [
      new (winston.transports.Console)({ level: 'info' })
    ]}),
    "the addFilter() method": {
      topic: function (logger) {
        logger.addFilter(function (msg) {
          return maskCardNumbers(msg);
        });
        return logger;
      },
      "should add the filter": function(logger) {
        assert.equal(helpers.size(logger.filters), 1);
      },
      "the log() method": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'card number 123456789012345 for testing');
        },
        "should filter the card number": function (transport, level, msg, meta) {
          assert.equal(msg, 'card number 123456****2345 for testing');
        }
      }
    }
  }
}).export(module);

