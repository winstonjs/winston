
var util = require('util'),
    events = require('events')
    
    transports = require('./transports');
    eyes = require('eyes')

var Logger = exports.Logger = function (options) {
  events.EventEmitter.call(this);
  
  // Default to 'info' Level
  this.level = 2;
  this.emitErrs = options.emitErrs || true;
  this.transports = [];
  
  var self = this;
  Object.keys(options.transports).forEach(function (tname) {
    var config = options.transports[tname];
    config = config instanceof Object ? config : { level: config };
    
    self.add(tname, config);
  }); 
};

util.inherits(Logger, events.EventEmitter);

var levels = Logger.prototype.levels = {
  silly: 0, 
  verbose: 1, 
  info: 2, 
  warn: 3, 
  error: 4
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
      meta, callback, len = this.transports.length;
  
  if (arguments.length === 3) {
    meta = {};
    callback = arguments[2]
  }
  else if (arguments.length === 4) {
    meta = arguments[2];
    callback = arguments[3];
  }
  
  if (this.transports.length === 0) return callback(new Error('Cannot log with no transports.'));
  else if (!levels[level]) return callback(new Error('Unknown log level: ' + level));
  
  this.transports.forEach(function (transport) {
    if ((transport.level && transport.level >= levels[level])
      || (!transport.level && self.level >= levels[level])) {
      transport.log(level, msg, meta, function (err, res) {
        if (err) errs.push({ error: err, transport: transport });
        if (err && self.emitErrs) return self.emit('error', err, transport);
        
        self.emit('log', levels[level], msg);
        if (++logged == len && callback) callback(errs ? errs : null); 
      });
    }
  });
};

Logger.prototype.add = function (transport, options) {
  var proto = Object.keys(transports).filter(function (k) { return k === transport });
  if (proto.length === 0) throw new Error('Cannot find Transport: ' + transport);
  
  this.transports.push(new (transports[transport])(options));
};

Logger.prototype.remove = function (transport) {
  if (!this.transports[transport]) throw new Error('Transport ' + transport + ' not attached to this instance');
  
  var transport = this.transports[transport];
  if (transport.close) transport.close();
};
