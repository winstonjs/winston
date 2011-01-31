/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

require.paths.unshift(require('path').join(__dirname));

var winston = exports;
var Levels = require('./winston/levels');
//
// Include transports defined by default by winston
//
winston.transports = require('winston/transports');

//
// function findTransport (transport)
//   Helper method to find existing transport
//
winston.findTransport = function (transport) {
  var name, existing = Object.keys(winston.transports).filter(function (k) { 
    return winston.transports[k] === transport;
  });

  return existing.length > 0 ? existing[0].toLowerCase() : null;
};

winston.Logger = require('winston/logger').Logger;
winston.hash   = require('winston/utils').hash;
winston.clone  = require('winston/utils').clone;

//
// We create and expose a "defaultLogger" so that the programmer may do the
// following without the need to create an instance of winston.Logger directly:
//   var winston = require('winston');
//   winston.log('info', 'some message');
//   winston.error('some error'); 
//
winston.defaultLogLevels = "npm";
winston.levels = winston.clone(Levels[winston.defaultLogLevels]);

var defaultLogger = new (winston.Logger)({ transports: [new (winston.transports.Console)()] });
Object.keys(defaultLogger.levels).forEach(function (level) {
  winston[level] = function () {
    return defaultLogger[level].apply(defaultLogger, arguments);
  };
});

['log', 'add', 'remove', 'profile', 'extend', 'addLevel', 'removeLevel'].forEach(function (method) {
  winston[method] = function () {
    return defaultLogger[method].apply(defaultLogger, arguments);
  };
});


//
// Define emitErrs property for default logger
//
Object.defineProperty(winston, 'emitErrs', {
  get: function () {
    return defaultLogger.emitErrs;
  },
  set: function (val) {
    defaultLogger.emitErrs = val;
  }
});

//
// function defaultTransports ()
//   returns the transports set on the default winston logger 
//
winston.defaultTransports = function () {
  return defaultLogger.transports;
};

winston.setLevel = function(level, options) {
  var self = this;
  var levels = self.levels;
  // Incase we are resetting the level
  if(levels[level] != undefined) self.removeLevel(level);

  options = options || {};
  var position = options.position || 0;
  //We don't want the levels to get out of synch
  if(position > size(levels)) position = size(levels);

  var color = options.color || "white";

  Object.keys(levels).forEach(function(level) {
    if(levels[level] >= position) {
      levels[level]++;
    }
  });
  defaultLogger.setLevel(level, options);
  winston[level] = function () {
    return defaultLogger[level].apply(defaultLogger, arguments);
  };
};

winston.removeLevel = function (level) {
  var self = this;
  var levels = self.levels;
  if(levels[level] != undefined) var position = levels[level];
  else throw new Error('Log level ' + level + ' does not exist.');
  delete levels[level];
  delete self[level];
  Object.keys(levels).forEach(function(level) {
    if(levels[level] > position) {
      levels[level]--;
    }
  });
  defaultLogger.removeLevel(level);
  return this;
};

winston.setDefaultLevels = function(levelType) {
  if(levelType != 'npm' || levelType !="syslog") throw new Error("incorrect level type");
  Object.keys(levels).forEach(function(level) {
    winston.removeLevel(level);
  });
  
  winston.defaultLogLevels = levelType;
  winston.levels = winston.clone(Levels[levelType]);
  
  Object.keys(levels).forEach(function(level) {
    winston.removeLevel(level);
  });
};