/*
 * rsyslog.js: Transport for logging to remote syslog
 *
 * (C) 2013 Fabio Grande
 * MIT LICENCE
 *
 */

var events = require('events'),
    dgram = require('dgram'),
    util = require('util'),
    common = require('../common'),
    syslevels = require('../config/syslog-config.js'),
    Transport = require('./transport').Transport;

//
// ### function RSysLog (options)
// #### @options {Object} Options for this instance.
// Constructor function for the RSysLog transport object responsible
// for send messages to SysLog daemon
//
var Rsyslog = exports.Rsyslog = function (options) {
  Transport.call(this, options);

  this.name     = 'rsyslog';
  this.host     = options.host   || 'localhost';
  this.port     = options.port   || 514;
  this.facility = options.facility || 0;
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Rsyslog, Transport);

//
// Expose the name of this Transport on the prototype
//
Rsyslog.prototype.name = 'rsyslog';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Rsyslog.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var self = this;

  var output = common.log({
      level:       level,
      message:     msg,
      meta:        meta,
    });

  // If the specified level is not included in syslog list, convert it into "debug".
  var _severity = 7;
  if (syslevels["levels"][level] !== undefined)
  {
    _severity = syslevels["levels"][level];
  }

  var _pri = (this.facility << 3) + _severity;
  var _buffer = new Buffer("<" + _pri + ">" + output);
  var client = dgram.createSocket("udp4");

  client.send(_buffer, 0, _buffer.length, this.port, this.host, function(err, bytes) {
    if (err)
    {
      throw err;
    }

    self.emit('logged');

    if (callback) callback(null, true);
    callback = null;

    client.close();
  });

};





