/*
 * winston-redis.js: A fixed-length Redis transport for Winston
 *
 * (C) 2011, Charlie Robbins
 *
 */

var redis = require('redis'),
    winston = require('../../winston'),
    common = require('../common'),
    util = require('util'),
    Stream = require('stream').Stream;

var Redis = exports.Redis = function (options) {
  var self = this;

  options       = options || {};
  options.host  = options.host || 'localhost';
  options.port  = options.port || 6379;
  options.debug = options.debug || false;

  this.name      = 'redis';
  this.redis     = redis.createClient(options.port, options.host);
  this.json      = options.json !== false;
  this.length    = options.length    || 200;
  this.container = options.container || 'winston';
  this.timestamp = options.timestamp || true;
  this.channel   = options.channel;

  if (options.auth) {
    this.redis.auth(options.auth);
  }

  // Suppress errors from the Redis client
  this.redis.on('error', function (err) {
    self.emit('error');
  });
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Redis, winston.Transport);

//
// Define a getter so that `winston.transports.Redis`
// is available and thus backwards compatible.
//
winston.transports.Redis = Redis;

//
// ### function log (level, msg, [meta], callback)
// Core logging method exposed to Winston. Metadata is optional.
//
Redis.prototype.log = function (level, msg, meta, callback) {
  var self = this;

  this.redis.llen(this.container, function (err, len) {
    if (err) {
      return self.emit('error', err);
    }

    // winston-redis originally did not
    // allow for json logs. JSON logs
    // become necessary with the advent
    // of querying/streaming.

    var output = common.log({
      level: level,
      message: msg,
      meta: meta,
      timestamp: self.timestamp,
      json: self.json
    });

    self.redis.lpush(self.container, output, function (err) {
      if (err) {
        return self.emit('error', err);
      }

      self.redis.ltrim(self.container, 0, self.length, function () {
        if (err) {
          return self.emit('error', err);
        }

        if (self.channel) {
          self.redis.publish(self.channel, output);
        }
        self.emit('logged');
      });
    });
  });

  callback(null, true);
};

//
// ### function query (options, callback)
// #### @options {Object} Query options.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport for logs.
//
Redis.prototype.query = function (options, callback) {
  options = this.normalizeQuery(options);

  var start = options.start || 0,
      end = options.rows + start;

  this.redis.lrange(this.container, start, end - 1, function(err, results) {
    if (err) return callback(err);

    results = results.map(function(data) {
      var log, time, obj;

      try {
        log = JSON.parse(data);
      } catch (e) {
        return;
      }

      if (typeof log !== 'object' || !log) return;

      time = new Date(log.timestamp);
      if ((options.from && time < options.from)
         || (options.until && time > options.until)) {
        return;
      }

      if (options.fields) {
        obj = {};
        options.fields.forEach(function(key) {
          obj[key] = log[key];
        });
        log = obj;
      }

      return log;
    }).filter(Boolean);

    if (options.order === 'desc') {
      results = results.reverse();
    }

    callback(null, results);
  });
};

//
// ### function stream (options)
// #### @options {Object} Streaming options.
// Return a log stream. Stream using pub/sub.
//
Redis.prototype.streamPubsub = function (options) {
  var self = this,
      options = options || {},
      stream = new Stream;

  stream.destroy = function() {
    this.destroyed = true;
    self.subscription.removeListener('message', message);
  };

  if (!this.subscription) {
    this.subscription = redis.createClient(
      this.redis.options.host,
      this.redis.options.port
    );
    this.subscription.subscribe(this.channel);
  }

  function message(channel, message) {
    if (stream.destroyed) return;

    try {
      message = JSON.parse(message);
    } catch (e) {
      return stream.emit('error',
        new Error('Could not parse: "' + message + '".'));
    }

    stream.emit('log', message);
  }

  this.subscription.on('message', message);

  return stream;
};

//
// ### function stream (options)
// #### @options {Object} Streaming options.
// Return a log stream. Stream using polling.
//
Redis.prototype.stream = function (options) {
  if (this.channel) return this.streamPubsub(options);

  var self = this,
      options = options || {},
      stream = new Stream,
      name = this.container,
      offset = 0,
      done;

  stream.destroy = function() {
    this.destroyed = true;
  };

  function check() {
    self.redis.lrange(name, offset, -1, function(err, results) {
      if (stream.destroyed) return;

      if (err) return stream.emit('error', err);

      offset += results.length;

      results.forEach(function(log) {
        try {
          stream.emit('log', JSON.parse(log));
        } catch (e) {
          return stream.emit('error',
            new Error('Could not parse: "' + log + '".'));
        }
      });

      setTimeout(check, 2000);
    });
  }

  if (options.start === -1) {
    delete options.start;
  }

  if (options.start == null) {
    this.redis.llen(name, function(err, len) {
      if (err) return stream.emit('error', err);
      offset = len;
      check();
    });
  } else {
    offset = options.start;
    check();
  }

  return stream;
};
