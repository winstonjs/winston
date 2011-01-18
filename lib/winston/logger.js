/*
 * logger.js: Core logger object used by winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..'));

var util = require('util'),
    events = require('events'),
    winston = require('winston');

function capitalize(str) {
  return str && str[0].toUpperCase() + str.slice(1);
}

//
// Time constants
//
var ticksPerMillisecond = 10000;

//
// function Logger (options)
//   Constructor for the logger object.
//
var Logger = exports.Logger = function (options) {
  events.EventEmitter.call(this);
  
  // Default to 'info' Level
  this.level = 'info';
  
  options = options || {};
  this.emitErrs = options.emitErrs || true;
  this.transports = {};
  this.profilers = {};
  
  var self = this;
  if (options.transports) {
    options.transports.forEach(function (transport) {
      self.transports[transport.name] = transport;
    }); 
  }
};

util.inherits(Logger, events.EventEmitter);

// TODO: Make levels configurable
var levels = Logger.prototype.levels = {
  silly: 0, 
  verbose: 1, 
  info: 2, 
  warn: 3,
  debug: 4, 
  error: 5
};

//
// Define prototype methods for each log level 
// e.g. logger.log('info', msg) <=> logger.info(msg)
//
Object.keys(levels).forEach(function (level) {
  Logger.prototype[level] = function (msg, meta, callback) {
    if (arguments.length === 2) {
      callback = meta;
      this.log(level, msg, callback);
    }
    else if (arguments.length === 3) {
      this.log(level, msg, meta, callback);
    }
  };
});

//
// function log (level, msg, [meta], callback)
//   Core logging method for Winston. Metadata is optional.
//
Logger.prototype.log = function (level, msg) {
  var self = this, logged = 0, errs = [],
      meta, callback, len = Object.keys(this.transports).length;
  
  if (arguments.length === 3) {
    meta = {};
    callback = arguments[2]
  }
  else if (arguments.length === 4) {
    meta = arguments[2];
    callback = arguments[3];
  }

  if (this.transports.length === 0) return callback(new Error('Cannot log with no transports.'));
  else if (typeof levels[level] === 'undefined') return callback(new Error('Unknown log level: ' + level));
  
  for (var key in this.transports) {
    var transport = this.transports[key];
    if ((transport.level && levels[transport.level] <= levels[level])
      || (!transport.level && levels[self.level] <= levels[level])) {
      transport.log(level, msg, meta, function (err) {
        if (err) errs.push({ error: err, transport: transport });
        if (err && self.emitErrs) return self.emit('error', err, transport);
        
        self.emit('log', transport, level, msg, meta);
        if (++logged == len && callback) callback(errs.length > 0 ? errs : null, level, msg, meta); 
      });
    }
  };
  
  return this;
};

//
// function add (transport, [options])
//   Adds a transport of the specified type to this instance.
//
Logger.prototype.add = function (transport, options) {
  var name = winston.findTransport(transport);
  
  if (!name && !transport.prototype.log) throw new Error('Unknown transport with no log() method');
  else if (this.transports[name]) throw new Error('Transport already attached: ' + name);
  
  var instance = (new (transport)(options));
  this.transports[instance.name] = instance;
  return this;
};

//
// function remove (transport) 
//   Removes a transport of the specified type from this instance.
//
Logger.prototype.remove = function (transport) {
  var name = winston.findTransport(transport);
  
  // If we can't find the name, try to use transport.name
  if (!name) name = transport.name;
  
  if (!this.transports[name]) throw new Error('Transport ' + name + ' not attached to this instance');
  
  var transportObject = this.transports[name];
  delete this.transports[name];
  if (transportObject.close) transportObject.close();
  return this;
};

//
// function profile (msg, [callback])
//   Tracks the time inbetween subsequent calls to this method
//   with the same [msg] parameter. The second call to this method
//   will log the difference in milliseconds along with the message.
//
Logger.prototype.profile = function (msg, callback) {
  var now = Date.now(), then;
  
  if (this.profilers[msg]) {
    then = this.profilers[msg];
    delete this.profilers[msg];
    return this.info(now - then + 'ms - ' + msg, callback);
  }
  else {
    this.profilers[msg] = now;
  }
};
