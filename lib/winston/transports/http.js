var util = require('util'),
    winston = require('../../winston'),
    request = require('request'),
    Stream = require('stream').Stream;

//
// ### function NsSocket (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Http transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var Http = exports.Http = function (options) {
  options = options || {};

  this.name = 'http';
  this.ssl = !!options.ssl;
  this.host = options.host;
  this.port = options.port || 80;
  this.auth = options.auth;
};

util.inherits(Http, winston.Transport);

//
// ### function _request ()
// Make a request to the winston server.
//
Http.prototype._request = function (options, callback) {
  var options = options || {},
      auth = options.auth || this.auth,
      path = options.path || this.path || '';

  delete options.auth;
  delete options.path;

  options = { json: options };
  options.method = 'POST';
  options.url = 'http'
    + (this.ssl ? 's' : '')
    + '://'
    + (auth ? auth.username + ':' : '')
    + (auth ? auth.password + '@' : '')
    + this.host
    + ':'
    + this.port
    + '/'
    + path;

  return request(options, callback);
};

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Http.prototype.log = function (level, msg, meta, callback) {
  var self = this;

  if (typeof meta === 'function') {
    callback = meta;
    meta = {};
  }

  var options = {
    method: 'collect',
    level: level,
    message: msg,
    meta: meta
  };

  // hack
  if (meta.auth) {
    options.auth = meta.auth;
    delete meta.auth;
  }

  // hack
  if (meta.path) {
    options.path = meta.path;
    delete meta.path;
  }

  this._request(options, function(err, res, body) {
    if (res && res.statusCode !== 200) {
      err = new Error('HTTP Status Code: ' + res.statusCode);
    }

    if (err) return callback(err);

    self.emit('logged');

    callback();
  });
};

//
// ### function query ()
// Query the transport.
//
Http.prototype.query = function (options, callback) {
  var self = this,
      options = options || {};

  options.method = 'query';

  this._request(options, function(err, res, body) {
    if (res && res.statusCode !== 200) {
      err = new Error('HTTP Status Code: ' + res.statusCode);
    }

    if (err) return callback(err);

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return callback(e);
      }
    }

    callback(null, body);
  });
};

//
// ### function stream ()
// Return a log stream.
//
Http.prototype.stream = function (options) {
  var self = this,
      options = options || {},
      stream = new Stream,
      req,
      buff;

  stream.destroy = function() {
    req.destroy();
  };

  options.method = 'stream';

  req = this._request(options);
  buff = '';

  req.on('data', function(data) {
    var data = (buff + data).split(/\n+/),
        l = data.length - 1,
        i = 0;

    for (; i < l; i++) {
      try {
        stream.emit('log', JSON.parse(data[i]));
      } catch (e) {
        stream.emit('error', e);
      }
    }

    buff = data[l];
  });

  req.on('error', function(err) {
    stream.emit('error', err);
  });

  return stream;
};
