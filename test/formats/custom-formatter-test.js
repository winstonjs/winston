/*
 * custom-formatter-test.js: Test function as formatter option for transport `{ formatter: function () {} }`
 *
 * (C) 2011 Charlie Robbins, Tom Shinnick, Andrii Melnyk
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    events = require('events'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

function assertFileFormatter (basename, options) {
  var filename = path.join(__dirname, 'fixtures', 'logs', basename + '.log');

  try { fs.unlinkSync(filename) }
  catch (ex) { }

  return {
    topic: function () {
      options.filename = filename;
      var transport = new (winston.transports.File)(options);

      // We must wait until transport file has emitted the 'flush'
      // event to be sure the file has been created and written
      transport.once('flush', this.callback.bind(this, null, filename));
      transport.log('info', 'What does the fox say?', null, function () {});
    },
    "should log with the appropriate format": function (_, filename) {
      var data = fs.readFileSync(filename, 'utf8');
      assert.isNotNull(data.match(options.pattern));
    }
  }
}

vows.describe('winston/transport/formatter').addBatch({
  "Without formatter": {
    "with file transport": assertFileFormatter('customFormatterNotSetForFile', {
      pattern: /info\:/,
      json: false,
      formatter: false
    })
  },
  "When formatter option is used": {
    "with file transport": {
      "with value set to false": assertFileFormatter('customFormatterFalseValue', {
        pattern: /info\:/,
        json: false,
        formatter: false
      }),
      "with value set to object ": assertFileFormatter('customFormatterObjectValue', {
        pattern: /info\:/,
        json: false,
        formatter: {}
      }),
      "and function value with custom format": assertFileFormatter('customFormatter', {
        pattern: /^\d{13,} INFO What does the fox say\?/,
        json: false,
        timestamp: function() {
          return Date.now();
        },
        formatter: function(params) {
          return params.timestamp() +' '+ params.level.toUpperCase() +' '+ (undefined !== params.message ? params.message : '') +
            ( params.meta && Object.keys(params.meta).length ? '\n'+ JSON.stringify(params.meta) : '' );
        }
      })
    }
  }
}).export(module);
