/*
 * logger.js: Core logger object used by winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
var events = require('events'),
    util = require('util'),
    config = require('./config'),
    internal = require('./internal');

function capitalize(str) {
  return str && str[0].toUpperCase() + str.slice(1);
}

//
// Time constants
//
var ticksPerMillisecond = 10000;

//
// ### function Logger (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Logger object responsible
// for persisting log messages and metadata to one or more transports.
//
var Logger = exports.Logger = function (options) {
  events.EventEmitter.call(this);
  options = options || {};
  
  var self = this;
  
  //
  // Set Levels and default logging level
  //
  this.padLevels = options.padLevels || false;
  this.setLevels(options.levels);
  
  //
  // Setup other intelligent default settings.
  //
  this.level       = options.level || 'info';
  this.emitErrs    = options.emitErrs || false;
  this.stripColors = options.stripColors || false;
  this.transports  = {};
  this.profilers   = {};
  this._names      = [];
  
  if (options.transports) {
    options.transports.forEach(function (transport) {
      self._names.push(transport.name);
      self.transports[transport.name] = transport;
    }); 
  }  
};

//
// Inherit from `events.EventEmitter`.
//
util.inherits(Logger, events.EventEmitter);

//
// ### function extend (target)
// #### @target {Object} Target to extend.
// Extends the target object with a 'log' method
// along with a method for each level in this instance.
//
Logger.prototype.extend = function (target) {
  var self = this;
  ['log', 'profile'].concat(Object.keys(this.levels)).forEach(function (method) {
    target[method] = function () {
      return self[method].apply(self, arguments);
    };
  });
  
  return this;
};

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Logger.prototype.log = function (level, msg) {
  var self = this, 
      callback,
      meta;
  
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

  function onError (err) {
    if (callback) {
      callback(err);
    }
    else if (self.emitErrs) {
      self.emit('error', err);
    };
  }
  
  if (this.transports.length === 0) {
    return onError(new Error('Cannot log with no transports.'));
  }
  else if (typeof self.levels[level] === 'undefined') {
    return onError(new Error('Unknown log level: ' + level));
  }
  
  for (var i = 0, l = this._names.length; i < l; i++) {
    var transport = this.transports[this._names[i]];
    if ((transport.level && self.levels[transport.level] <= self.levels[level])
      || (!transport.level && self.levels[self.level] <= self.levels[level])) {

      //
      // For consideration of terminal 'color" programs like colors.js,
      // which can add ANSI escape color codes to strings, we destyle the 
      // ANSI color escape codes when `this.stripColors` is set.
      //
      // see: http://en.wikipedia.org/wiki/ANSI_escape_code
      //
      if (this.stripColors) {
        var code = /\u001b\[\d+m/g;
        msg = ('' + msg).replace(code, '');
      }

      transport.log(level, msg, meta, function (err) {
        self.emit('log', transport, level, msg, meta);
      });
    }
  }
  
  //
  // Immediately respond to the callback
  //
  if (callback) {
    callback(null, level, msg, meta);    
  }
  
  return this;
};

//
// ### function add (transport, [options])
// #### @transport {Transport} Prototype of the Transport object to add.
// #### @options {Object} **Optional** Options for the Transport to add.
// Adds a transport of the specified type to this instance.
//
Logger.prototype.add = function (transport, options) {
  var instance = (new (transport)(options));
  
  if (!instance.name && !instance.log) {
    throw new Error('Unknown transport with no log() method');
  }
  else if (this.transports[instance.name]) {
    throw new Error('Transport already attached: ' + instance.name);
  }
  
  this.transports[instance.name] = instance;
  this._names = Object.keys(this.transports);
  
  if (instance.on) {
    //
    // If the instance has an `on` method
    // then listen for the `'error'` event.
    //
    instance.on('error', this._onError.bind(this, instance));
  }

  return this;
};

//
// ### function remove (transport) 
// #### @transport {Transport} Transport to remove.
// Removes a transport of the specified type from this instance.
//
Logger.prototype.remove = function (transport) {
  var name = transport.name || transport.prototype.name;
    
  if (!this.transports[name]) {
    throw new Error('Transport ' + name + ' not attached to this instance');
  }
  
  var instance = this.transports[name];
  delete this.transports[name];
  this._names = Object.keys(this.transports);
  
  if (instance.close) {
    instance.close();
  }
  
  if (instance.removeListener) {
    instance.removeListener('error', this._onError);
  }
  
  return this;
};

//
// ### function profile (id, [msg, meta, callback])
// #### @id {string} Unique id of the profiler 
// #### @msg {string} **Optional** Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Tracks the time inbetween subsequent calls to this method
// with the same `id` parameter. The second call to this method
// will log the difference in milliseconds along with the message.
//
Logger.prototype.profile = function (id) {
  var now = Date.now(), then, args,
      msg, meta, callback;
  
  if (this.profilers[id] && arguments.length !== 1) {
    then = this.profilers[id];
    delete this.profilers[id];
    
    // Support variable arguments: msg, meta, callback
    args     = Array.prototype.slice.call(arguments);
    callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    meta     = typeof args[args.length - 1] === 'object' ? args.pop() : {};
    msg      = args.length === 2 ? args[1] : id; 
    
    // Set the duration property of the metadata
    meta.duration = now - then + 'ms'; 
    return this.info(msg, meta, callback);
  }
  else {
    this.profilers[id] = now;
  }
  
  return this;
};

//
// ### function setLevels (target)
// #### @target {Object} Target levels to use on this instance
// Sets the `target` levels specified on this instance.
//
Logger.prototype.setLevels = function (target) {
  return internal.setLevels(this, this.levels, target);
};

//
// ### function cli ()
// Configures this instance to have the default
// settings for command-line interfaces: no timestamp,
// colors enabled, padded output, and additional levels.
//
Logger.prototype.cli = function () {
  this.padLevels = true;
  this.setLevels(config.cli.levels);
  config.addColors(config.cli.colors);
  
  if (this.transports.console) {
    this.transports.console.colorize = true;
    this.transports.console.timestamp = false;
  }
  
  return this;
};

//
// ### @private function _onError (transport, err)
// #### @transport {Object} Transport on which the error occured
// #### @err {Error} Error that occurred on the transport
// Bubbles the error, `err`, that occured on the specified `transport`
// up from this instance if `emitErrs` has been set.
//
Logger.prototype._onError = function (transport, err) {
  if (self.emitErrs) {
    self.emit('error', err, transport);
  }
};