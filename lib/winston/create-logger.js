'use strict';

const util = require('util');
const { LEVEL } = require('triple-beam');
const config = require('./config');
const Logger = require('./logger');
const debug = require('diagnostics')('winston:create-logger');

//
// ### function createLogger (opts)
// #### @opts {Object} Options for the created logger.
// Create a new instance of a winston Logger. Creates a new
// prototype for each instance.
//
module.exports = function (opts) {
  opts = opts || {};
  opts.levels = opts.levels || config.npm.levels;

  //
  // Create a new prototypal derived logger for which the levels
  // can be attached to the prototype of. This is a V8 optimization
  // that is well know to increase performance of prototype functions.
  //
  function DerivedLogger(options) { Logger.call(this, options); }
  util.inherits(DerivedLogger, Logger);

  Object.keys(opts.levels).forEach(function (level) {
    debug('Define prototype method for "%s"', level);
    if (level === 'log') {
      console.warn('Level "log" not defined: conflicts with the method "log". Use a different level name.');
      return;
    }

    //
    // Define prototype methods for each log level
    // e.g. logger.log('info', msg) <––> logger.info(msg)
    //
    DerivedLogger.prototype[level] = function (msg) {
      //
      // Optimize the hot-path which is the single object.
      //
      if (arguments.length === 1) {
        const info = msg.message && msg || { message: msg };
        info.level = info[LEVEL] = level;
        this.write(info);
        return this;
      }

      //
      // Otherwise build argument list which could potentially conform to either
      // 1. v3 API: log(obj)
      // 2. v1/v2 API: log(level, msg, ... [string interpolate], [{metadata}], [callback])
      //
      this.log.apply(this, [level].concat(Array.prototype.slice.call(arguments)));
    };
  });

  return new DerivedLogger(opts);
};
