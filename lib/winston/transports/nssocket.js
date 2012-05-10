/*
 * winston-nssocket.js: Transport for logging to Nssocket
 *
 * (C) 2011 Maciej Małecki
 * MIT LICENSE
 *
 */

var util = require('util'),
    winston = require('../../winston'),
    nssocket = require('nssocket'),
    Stream = require('stream').Stream;

//
// ### function NsSocket (options)
// #### @options {Object} Options for this instance.
// Constructor function for the NsSocket transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var NsSocket = exports.Nssocket = function (options) {
  options = options || {};

  this.name = 'nssocket';
  this.logEvent = options.logEvent || ['log'];

  this.socket = new nssocket.NsSocket(options.socket || {
    reconnect: true
  });

  this.socket.connect(options.host, options.port);
};

util.inherits(NsSocket, winston.Transport);

//
// Expose the name of this Transport on the prototype
//
NsSocket.prototype.name = 'nssocket';

//
// Define a getter so that `winston.transports.Nssocket`
// is available and thus backwards compatible.
//
winston.transports.Nssocket = NsSocket;

//
// Keep uid counter for query requests.
//
NsSocket.uid = 0;

//
// ### function close ()
// Closes the stream associated with this instance.
//
NsSocket.prototype.close = function () {
  this.socket.destroy();
};

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
NsSocket.prototype.log = function (level, msg, meta, callback) {
  var self = this;

  if (typeof meta == 'function') {
    callback = meta;
    meta = {};
  }

  self.socket.send(self.logEvent, {
    meta: meta,
    level: level,
    message: msg
  }, function (err) {
    if (err) {
      return self.emit('error', err);
    }

    self.emit('logged');
    callback && callback();
  });
};

//
// ### function query (options, callback)
// #### @options {Object} Loggly-like query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport. Options object is optional.
//
NsSocket.prototype.query = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var self = this,
      options = this.normalizeQuery(options),
      id = NsSocket.uid++ + '';

  this.socket.send(['query', id], options);

  this.socket.dataOnce(['result', id], function (log) {
    if (callback) callback(null, log);
  });

  this.socket.dataOnce(['error', id], function (err) {
    if (callback) callback(err);
  });
};

//
// ### function stream (options)
// #### @options {Object} Stream options for this instance.
// Returns a log stream for this transport. Options object is optional.
//
NsSocket.prototype.stream = function (options) {
  var self = this,
      options = options || {},
      stream = new Stream;

  stream.destroy = function () {
    self.socket.undata(['log'], onData);
  };

  this.socket.send(['stream'], options);

  this.socket.data(['log'], onData);

  function onData(log) {
    stream.emit('log', log);
  }

  return stream;
};
