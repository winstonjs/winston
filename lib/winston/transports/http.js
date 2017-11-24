'use strict';

const util = require('util');
const http = require('http');
const https = require('https');
const Stream = require('stream').Stream;
const TransportStream = require('winston-transport');

//
// ### function Http (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Http transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var Http = module.exports = function (options) {
  TransportStream.call(this, options);
  options = options || {};

  this.name = 'http';
  this.ssl = !!options.ssl;
  this.host = options.host || 'localhost';
  this.port = options.port;
  this.auth = options.auth;
  this.path = options.path || '';
  this.agent = options.agent;
  this.headers = options.headers || {};
  this.headers['content-type'] = 'application/json';

  if (!this.port) {
    this.port = this.ssl ? 443 : 80;
  }
};

util.inherits(Http, TransportStream);

//
// Expose the name of this Transport on the prototype
//
Http.prototype.name = 'http';

//
// ### function log (meta)
// #### @meta {Object} **Optional** Additional metadata to attach
// Core logging method exposed to Winston.
//
Http.prototype.log = function (info, callback) {
  var self = this;

  this._request(info, function (err, res) {
    if (res && res.statusCode !== 200) {
      err = new Error('Invalid HTTP Status Code: ' + res.statusCode);
    }

    if (err) {
      self.emit('warn', err);
    } else {
      self.emit('logged', info);
    }
  });

  //
  // Remark: (jcrugzz) Fire and forget here so requests dont cause buffering
  // and block more requests from happening?
  //
  if (callback) {
    setImmediate(callback);
  }
};

//
// ### function query (options, callback)
// #### @options {Object} Loggly-like query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport. Options object is optional.
//
Http.prototype.query = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = this.normalizeQuery(options);
  options = {
    method: 'query',
    params: options
  };

  if (options.params.path) {
    options.path = options.params.path;
    delete options.params.path;
  }

  if (options.params.auth) {
    options.auth = options.params.auth;
    delete options.params.auth;
  }

  this._request(options, function (err, res, body) {
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
// ### function stream (options)
// #### @options {Object} Stream options for this instance.
// Returns a log stream for this transport. Options object is optional.
//
Http.prototype.stream = function (options) {
  options = options || {};

  const stream = new Stream();

  options = {
    method: 'stream',
    params: options
  };

  if (options.params.path) {
    options.path = options.params.path;
    delete options.params.path;
  }

  if (options.params.auth) {
    options.auth = options.params.auth;
    delete options.params.auth;
  }

  let buff = '';
  const req = this._request(options);

  stream.destroy = function () {
    req.destroy();
  };

  req.on('data', function (data) {
    data = (buff + data).split(/\n+/);
    const l = data.length - 1;
    let i = 0;

    for (; i < l; i++) {
      try {
        stream.emit('log', JSON.parse(data[i]));
      } catch (e) {
        stream.emit('error', e);
      }
    }

    buff = data[l];
  });

  req.on('error', function (err) {
    stream.emit('error', err);
  });

  return stream;
};

//
// ### function _request (options, callback)
// #### @callback {function} Continuation to respond to when complete.
// Make a request to a winstond server or any http server which can
// handle json-rpc.
//
Http.prototype._request = function (options, callback) {
  options = options || {};

  const auth = options.auth || this.auth;
  const path = options.path || this.path || '';

  delete options.auth;
  delete options.path;

  // Prepare options for outgoing HTTP request
  const req = (this.ssl ? https : http).request({
    method: 'POST',
    host: this.host,
    port: this.port,
    path: '/' + path.replace(/^\//, ''),
    headers: this.headers,
    auth: auth ? (auth.username + ':' + auth.password) : '',
    agent: this.agent
  });

  req.on('error', callback);
  req.on('response', function (res) {
    res.on('end', function () {
      callback(null, res);
    }).resume();
  });

  req.end(new Buffer(JSON.stringify(options), 'utf8'));
};
