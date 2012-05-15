var assert = require('assert'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers');

module.exports = function (transport, options) {
  var logger = transport instanceof winston.Logger
    ? transport
    : new winston.Logger({
        transports: [
          new transport(options)
        ]
      });

  // hack to fix transports that don't log
  // any unit of time smaller than seconds
  var common = require('../../lib/winston/common');
  common.timestamp = function() {
    return new Date().toISOString();
  };

  var transport = logger.transports[logger._names[0]];

  var out = {
    'topic': logger,
    'when passed valid options': {
      'should have the proper methods defined': function () {
        switch (transport.name) {
          case 'console':
            helpers.assertConsole(transport);
            break;
          case 'file':
            helpers.assertFile(transport);
            break;
          case 'webhook':
            helpers.assertWebhook(transport);
            break;
          case 'couchdb':
            helpers.assertCouchdb(transport);
            break;
        }
        assert.isFunction(transport.log);
      }
    },
    'the log() method': helpers.testNpmLevels(transport,
      'should respond with true', function (ign, err, logged) {
        assert.isNull(err);
        assert.isNotNull(logged);
      }
    ),
    'the query() method': {
      'using basic querying': {
        'topic': function (logger) {
          if (!transport.query) return;
          var cb = this.callback;
          logger.log('info', 'hello world', {}, function () {
            logger.query(cb);
          });
        },
        'should return matching results': function (err, results) {
          if (!transport.query) return;
          results = results[transport.name];
          while (!Array.isArray(results)) {
            results = results[Object.keys(results).pop()];
          }
          var log = results.pop();
          assert.ok(log.message.indexOf('hello world') === 0
                    || log.message.indexOf('test message') === 0);
        }
      },
      'using the rows option': {
        'topic': function (logger) {
          if (!transport.query) return;
          var cb = this.callback;
          logger.log('info', 'hello world', {}, function () {
            logger.query({ rows: 1 }, cb);
          });
        },
        'should return one result': function (err, results) {
          if (!transport.query) return;
          results = results[transport.name];
          while (!Array.isArray(results)) {
            results = results[Object.keys(results).pop()];
          }
          assert.equal(results.length, 1);
        }
      },
      'using fields and order option': {
        'topic': function (logger) {
          if (!transport.query) return;
          var cb = this.callback;
          // wait a second to increase timestamp
          // some transports may not be logging
          // a timestamp in smaller units of time
          // than seconds.
          setTimeout(function () {
            logger.log('info', 'hello world', {}, function () {
              logger.query({ order: 'asc', fields: ['timestamp'] }, cb);
            });
          }, 2000);
        },
        'should return matching results': function (err, results) {
          if (!transport.query) return;
          results = results[transport.name];
          while (!Array.isArray(results)) {
            results = results[Object.keys(results).pop()];
          }
          assert.equal(Object.keys(results[0]).length, 1);
          assert.ok(new Date(results.shift().timestamp)
                  < new Date(results.pop().timestamp));
        }
      }
    },
    'the stream() method': {
      'topic': function () {
        if (!transport.stream) return;

        logger.log('info', 'hello world', {});

        var cb = this.callback,
            j = 10,
            i = 10,
            results = [],
            stream = logger.stream({});

        stream.on('log', function (log) {
          results.push(log);
          results.stream = stream;
          if (!--j) cb(null, results);
        });

        stream.on('error', function () {});

        while (i--) logger.log('info', 'hello world ' + i, {});
      },
      'should stream logs': function (err, results) {
        if (!transport.stream) return;
        results.forEach(function (log) {
          assert.ok(log.message.indexOf('hello world') === 0
                    || log.message.indexOf('test message') === 0);
        });
        results.stream.destroy();
      }
    }
  };

  // TODO: add couch and redis to .travis.yml
  if (process.env.CI && process.env.TRAVIS) {
    delete out['the query() method'];
    delete out['the stream() method'];
  }

  return out;
};
