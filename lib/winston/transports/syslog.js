/*
 * syslog.js: Transport for logging to a remote syslog consumer
 *
 * (C) 2011 Squeeks
 * MIT LICENCE
 *
 */

var glossy = require('glossy').Produce,
    dgram  = require('dgram'),
    net    = require('net'),
    utils  = require('./../utils'); 

var Syslog = exports.Syslog = function (options) {
  options = options || {};

  // Syslog consumer
  this.host     = options.host     || 'localhost'; // Sending to
  this.port     = options.port     || 514;
  this.protocol = options.protocol || 'udp4';

  // Message defaults
  this.msgHost  = options.msgHost  || 'localhost'; // Sending from  
  this.msgType  = options.msgType  || 'BSD';
  this.facility = options.facility || 'local0';
  this.level    = options.level    || 'info';
  this.pid      = options.pid      || 1;

  this.producer = new glossy.Producer({
    type:     options.msgType  || 'BSD',
    pid:      options.pid      || 1,
    facility: options.facility || 'local0'
  }); 

};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
Syslog.prototype.log = function (level, msg, meta, callback) {

  var message = utils.clone(meta);

  var syslogMsg = this.producer.produce({
    severity: this.level,
    host:     this.msgHost,
    date:     new Date(Date()),
    message:  message
  });

  if(this.protocol.match(/^udp|unix/)) {
    var msgBuff = new Buffer(syslogMsg);
    var client  = dgram.createSocket(this.protocol);
    client.send(msgBuff, 0, msgBuff.length, this.port, this.host );
    client.close();
  }

  callback(null, true);
};
