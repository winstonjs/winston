
var util = require('util'),
    events = require('events'),
    transports = require('./transports');

function capitalize(str) {
  return str && str[0].toUpperCase() + str.slice(1);
}

var Logger = exports.Logger = function (options) {
  events.EventEmitter.call(this);
  
  // Default to 'info' Level
  this.level = 'info';
  
  options = options || {};
  this.emitErrs = options.emitErrs || true;
  this.transports = {};
  
  var self = this;
  if (options.transports) {
    Object.keys(options.transports).forEach(function (tname) {
      var config = options.transports[tname];
      config = config instanceof Object ? config : { level: config };

      self.add(tname, config);
    }); 
  }
};

util.inherits(Logger, events.EventEmitter);

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
// i.e. logger.log('info', msg) <=> logger.info(msg)
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
      transport.log(level, msg, meta, function (err, res) {
        if (err) errs.push({ error: err, transport: transport });
        if (err && self.emitErrs) return self.emit('error', err, transport);
        
        self.emit('log', transport, level, msg, meta);
        if (++logged == len && callback) callback(errs.length > 0 ? errs : null); 
      });
    }
  };
};

Logger.prototype.add = function (transport, options) {
  var name = capitalize(transport),
      proto = Object.keys(transports).filter(function (k) { return k === name });

  transport = transport.toLowerCase();
  if (proto.length === 0) throw new Error('Cannot find Transport: ' + name);  
  else if (this.transports[transport]) throw new Error('Transport already attached: ' + name);
  
  this.transports[transport] = (new (transports[name])(options));
  return this;
};

Logger.prototype.remove = function (transport) {
  transport = transport.toLowerCase();
  if (!this.transports[transport]) throw new Error('Transport ' + transport + ' not attached to this instance');
  
  var transportObject = this.transports[transport];
  delete this.transports[transport];
  if (transportObject.close) transportObject.close();
  return this;
};
