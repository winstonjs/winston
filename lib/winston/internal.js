/*
 * internal.js: Internal helper and utility functions for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    crypto = require('crypto'),
    qs = require('querystring'),
    config = require('./config');

//
// ### function setLevels (target, past, current)
// #### @target {Object} Object on which to set levels.
// #### @past {Object} Previous levels set on target.
// #### @current {Object} Current levels to set on target.
// Create functions on the target objects for each level 
// in current.levels. If past is defined, remove functions
// for each of those levels.
//
var setLevels = exports.setLevels = function (target, past, current, isDefault) {
  if (past) {
    Object.keys(past).forEach(function (level) {
      delete target[level];
    });
  }

  target.levels = current || config.npm.levels;
  if (target.padLevels) {
    target.levelLength = longestElement(Object.keys(target.levels));
  }
  
  //
  //  Define prototype methods for each log level
  //  e.g. target.log('info', msg) <=> target.info(msg)
  //
  Object.keys(target.levels).forEach(function (level) {
    target[level] = function (msg) {
      var args     = Array.prototype.slice.call(arguments),
          callback = typeof args[args.length - 1] === 'function' ? args.pop() : null,
          meta     = args.length === 2 ? args.pop() : null;

      return target.log(level, msg, meta, callback);
    };
  });
  
  return target;
};

//
// ### function longestElement
// #### @xs {Array} Array to calculate against
// Returns the longest element in the `xs` array.
//
var longestElement = exports.longestElement = function (xs) {
  return Math.max.apply(
    null,
    xs.map(function (x) { return x.length })
  );
};

//
// ### function clone (obj)
// #### @obj {Object} Object to clone.
// Helper method for deep cloning pure JSON objects
// i.e. JSON objects that are either literals or objects (no Arrays, etc)
//
var clone = exports.clone = function (obj) {
  var clone = {};
  for (var i in obj) {
    clone[i] = obj[i] instanceof Object ? exports.clone(obj[i]) : obj[i];
  }

  return clone;
};

//
// function log (level, msg, meta)
//   Generic logging function for returning timestamped strings
//
var log = exports.log = function (level, msg, meta, options) {
  var prefixfn    = typeof options.timestamp === 'function' ? options.timestamp : timestamp,
      output      = options.timestamp ? prefixfn() + ' - ' : '',
      targetLevel = options.colorize ? config.colorize(level) : level,
      metac       = exports.clone(meta);
      
  output += targetLevel + ': ' + msg;
  
  if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
    output += ' ' + qs.unescape(qs.stringify(meta, ','));
  }
  
  return output;
}

//
// ### function hash (str)
// #### @str {string} String to hash.
// Utility function for creating unique ids
// e.g. Profiling incoming HTTP requests on the same tick
//
var hash = exports.hash = function (str) {
  return crypto.createHash('sha1').update(str).digest('hex');
};

//
// ## Borrowed from node.js core
// I wanted a universal lowercase header message, as opposed to the `DEBUG`
// (i.e. all uppercase header) used only in `util.debug()`
//
var months = ['Jan', 'Feb', 'Mar', 'Apr', 
              'May', 'Jun', 'Jul', 'Aug', 
              'Sep', 'Oct', 'Nov', 'Dec'];

//
// ### function pad (n)
// Returns a padded string if `n < 10`.
//
var pad = exports.pad = function (n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
};

//
// ### function timestamp ()
// Returns a timestamp string for the current time.
//
var timestamp = exports.timestamp = function () {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
              
  return [d.getDate(), months[d.getMonth()], time].join(' ');
};