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

function maskSecrets(msg, meta) {
  var match;
  while (match = msg.match(/(secret|SECRET|Secret)/)) {
    var toBeMasked = match[1];
    msg = msg.replace(toBeMasked, '******');
  }
  meta = Object.keys(meta).reduce(function (maskedMeta, key) {
    if (key !== 'SECRET' && key !== 'Secret' && key !== 'secret') {
      maskedMeta[key] = meta[key];
    } else {
      maskedMeta[key] = '<REDACTED>';
    }
    return maskedMeta;
  }, {});

  return {
      msg: msg,
      meta: meta
  };
}

vows.describe('winston/logger/filter').addBatch({
  "An instance of winston.Logger": {
    topic: new (winston.Logger)({transports: [
      new (winston.transports.Console)({ level: 'info' })
    ]}),
    "the addFilter() method, adding a filter only for the message": {
      topic: function (logger) {
        logger.addFilter(function (msg) {
          return maskCardNumbers(msg);
        });
        return logger;
      },
      "should add the filter": function (logger) {
        assert.equal(helpers.size(logger.filters), 1);
      },
      "the log() method with a filtered message": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'card number 123456789012345 for testing');
        },
        "should filter the card number": function (transport, level, msg, meta) {
          assert.equal(msg, 'card number 123456****2345 for testing');
        }
      }
    },
  }
}).addBatch({
  "A fresh instance of winston.Logger": {
    topic: new (winston.Logger)({transports: [
      new (winston.transports.Console)({ level: 'info' })
    ]}),
    "the addFilter() method adding a filter for the message and metadata": {
      topic: function (logger) {
        logger.addFilter(function (msg, meta) {
          return maskSecrets(msg, meta);
        });
        return logger;
      },
      "the log() method with a filtered message and filtered metadata": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info',
                     'We should make sure the secret stays SECRET.',
                     { 'SECRET': "You shouldn't see this.",
                       'public': 'But you can look at this.',
                       'secret': "We'll have to take you to Area-51 now.",
                       'not-secret': 'No worries about this one.',
                       'Secret': "It's confidential!" });
        },
        "should filter out secrets": function (transport, level, msg, meta) {
          assert.equal(msg, 'We should make sure the ****** stays ******.');
          assert.equal(meta.SECRET, '<REDACTED>');
          assert.equal(meta.public, 'But you can look at this.');
          assert.equal(meta.secret, '<REDACTED>');
          assert.equal(meta['not-secret'], 'No worries about this one.');
          assert.equal(meta.Secret, '<REDACTED>');
        }
      }
    }
  }
}).export(module);
