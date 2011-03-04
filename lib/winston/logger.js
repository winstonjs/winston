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
    winston = require('winston'),
    utils = require('./utils');

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
  
  var self = this;
  options = options || {};
  
  // Set Levels and default logging level
  this.padLevels = options.padLevels || false;
  this.setLevels(options.levels);
  this.level = options.level || 'info';
  
  this.emitErrs = options.emitErrs || false;
  this.transports = {};
  this.profilers = {};
  
  if (options.transports) {
    options.transports.forEach(function (transport) {
      self.transports[transport.name] = transport;
    }); 
  }  
};

util.inherits(Logger, events.EventEmitter);

//
// function extend (target)
//   Extends the target object with a 'log' method
//   along with a method for each level in this instance.
//
Logger.prototype.extend = function (target) {
  var self = this;
  ['log', 'profile'].concat(Object.keys(this.levels)).forEach(function (method) {
    target[method] = function () {
      return self[method].apply(self, arguments);
    };
  });
};

//
// function log (level, msg, [meta, callback])
//   Core logging method for Winston. Metadata and callback are is optional.
//
Logger.prototype.log = function (level, msg) {
  var self = this, logged = 0, errs = [],
      len = Object.keys(this.transports).length,
      meta, callback;
  
  if (arguments.length === 3) {
    if (typeof arguments[2] === 'function') {
      meta = {};
      callback = arguments[2];
    }
    else if (typeof arguments[2] === 'object') {
      meta = arguments[2];
    }
  }
  else if (arguments.length === 4) {
    meta = arguments[2];
    callback = arguments[3];
  }

  // If we should pad for levels, do so
  if (this.padLevels) {
    msg = new Array(this.levelLength - level.length).join(' ') + msg;
  }

  if (this.transports.length === 0) return callback(new Error('Cannot log with no transports.'));
  else if (typeof self.levels[level] === 'undefined') return callback(new Error('Unknown log level: ' + level));
  
  for (var key in this.transports) {
    var transport = this.transports[key];
    if ((transport.level && self.levels[transport.level] <= self.levels[level])
      || (!transport.level && self.levels[self.level] <= self.levels[level])) {
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
// function profile (id, [msg, meta, callback])
//   Tracks the time inbetween subsequent calls to this method
//   with the same [id] parameter. The second call to this method
//   will log the difference in milliseconds along with the message.
//
Logger.prototype.profile = function (id) {
  var now = Date.now(), then, args,
      msg, meta, callback;
  
  if (this.profilers[id] && arguments.length !== 1) {
    then = this.profilers[id];
    delete this.profilers[id];
    
    // Support variable arguments: msg, meta, callback
    args = Array.prototype.slice.call(arguments);
    callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    meta = typeof args[args.length - 1] === 'object' ? args.pop() : {};
    msg = args.length === 2 ? args[1] : id; 
    
    // Set the duration property of the metadata
    meta.duration = now - then + 'ms'; 
    return this.info(msg, meta, callback);
  }
  else {
    this.profilers[id] = now;
  }
};

Logger.prototype.setLevels = function (current) {
  return utils.setLevels(this, this.levels, current);
};