/*
 * Couchdb.js: Transport for logging to Couchdb
 *
 * (C) 2011 Max Ogden
 * MIT LICENSE
 *
 */

var events = require('events'),
    http = require('http'),
    util = require('util'),
    common = require('../common'),
    Transport = require('./transport').Transport,
    Stream = require('stream').Stream,
    request = require('request');

//
// ### function Couchdb (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for making arbitrary HTTP requests whenever log messages and metadata
// are received.
//
var Couchdb = exports.Couchdb = function (options) {
  Transport.call(this, options);

  this.name   = 'Couchdb';
  this.db     = options.db;
  this.user   = options.user;
  this.pass   = options.pass;
  this.host   = options.host   || 'localhost';
  this.port   = options.port   || 5984;
  this.streaming = options.streaming;

  if (options.auth) {
    //
    // TODO: add http basic auth options for outgoing HTTP requests
    //
  }

  if (options.ssl) {
    //
    //  TODO: add ssl support for outgoing HTTP requests
    //
  }
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Couchdb, Transport);

//
// Expose the name of this Transport on the prototype
//
Couchdb.prototype.name = 'Couchdb';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Couchdb.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var self = this,
      message = common.clone(meta || {}),
      options,
      req;

  message.level = level;
  message.message = msg;

  // Prepare options for outgoing HTTP request
  options = {
    host: this.host,
    port: this.port,
    path: "/" + this.db,
    method: "POST",
    headers: {"content-type": "application/json"}
  };

  if (options.user && options.pass) {
    options.headers["Authorization"] = "Basic " + new Buffer(options.user + ":" + options.pass).toString('base64');
  }

  // Perform HTTP logging request
  req = http.request(options, function (res) {
    //
    // No callback on request, fire and forget about the response
    //
    self.emit('logged', res);
  });

  req.on('error', function (err) {
    //
    // Propagate the `error` back up to the `Logger` that this
    // instance belongs to.
    //
    self.emit('error', err);
  });

  //
  // Write logging event to the outgoing request body
  //
  req.write(JSON.stringify({
    method: 'log',
    params: {
      timestamp: new Date(), // RFC3339/ISO8601 format instead of common.timestamp()
      msg: msg,
      level: level,
      meta: meta
    }
  }));

  req.end();

  // Always return true, regardless of any errors
  callback(null, true);
};

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Couchdb.prototype._request = function(opt, callback) {
  if (opt.path) {
    opt.url = 'http://'
      + this.host
      + ':'
      + this.port
      + '/'
      + this.db
      + opt.path;
    delete opt.path;
  }

  return request(opt, callback);
};

//
// ### function query (options)
// #### @options {Object} Set stream options
// #### @callback {function} Callback
// Query the transport.
//

Couchdb.prototype.query = function (options, callback) {
  this.normalizeQuery(options);

  // TODO: implement query options
  var req = this._request({
    method: options.method || 'GET',
    path: options.view || options.path,
    json: options.body || {}
  }, function(err, res, body) {
    callback(err, body);
  });
};

//
// ### function stream (options)
// #### @options {Object} Set stream options
// Returns a log stream.
//

Couchdb.prototype.stream = function(options) {
  var options = options || {};

  var stream = new Stream;

  stream.destroy = function() {
    this.destroyed = true;
  };

  function onData(log) {
    if (check(log)) {
      stream.emit('log', log);
    }
  }

  function check(log) {
    if (!log) return;

    var keys = Object.keys(log.meta || {})
      , l = keys.length
      , i = 0;

    for (; i < l; i++) {
      if (options[key] && options[key] !== log.meta[key]) {
        return;
      }
    }

    return true;
  }

  var req = self._request({
    method: 'GET',
    path: '/_changes',
    qs: {
      feed: 'continuous',
      include_docs: true,
      descending: false,
      style: 'main_only'
    }
  });

  req.on('response', function(res) {
    var buff = '';

    res.setEncoding('utf8');

    res.on('data', function() {
      if (stream.destroyed) return req.destroy();

      var data = (buff + data).split(/\n+/)
        , l = data.length - 1
        , i = 0;

      for (; i < l; i++) {
        try {
          log = JSON.parse(data[i]);
          if (!log.deleted) {
            onData(log.doc);
          }
        } catch (e) {
          stream.emit('error', e);
        }
      }

      buff = data[l];
    });

    res.on('end', function() {
      stream.emit('close');
      stream.emit('end');
    });
  });

  return stream;
};

//
// ### function stream (options)
// #### @options {Object} Set stream options
// Returns a log stream.
//

Couchdb.prototype.streamPoll = function(options) {
  var options = options || {};

  var stream = new Stream;

  stream.destroy = function() {
    this.destroyed = true;
  };

  function check(log) {
    if (!log || !log.meta) return true;

    var keys = Object.keys(log.meta)
      , l = keys.length
      , i = 0;

    for (; i < l; i++) {
      if (options[key] && options[key] !== log.meta[key]) {
        return;
      }
    }

    return true;
  }

  (function check() {
    var req = self._request({
      method: 'GET',
      path: options.view
    }, function(err, res, logs) {
      if (stream.destroyed) return;

      if (err) {
        stream.emit('error', err);
        return setTimeout(check, 2000);
      }

      try {
        logs = JSON.parse(logs);
      } catch (e) {
        return stream.emit('error', e);
      }

      logs.forEach(function(log) {
        if (check(log)) {
          stream.emit('log', log);
        }
      });

      setTimeout(check, 2000);
    });
  })();

  return stream;
};
