/**
 * create-logger.js: Logger factory for winston logger instances.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const { LEVEL } = require('triple-beam');
const config = require('./config');
const Logger = require('./logger');
const debug = require('diagnostics')('winston:create-logger');

/**
 * DerivedLogger to attach the logs level methods.
 * @type {DerivedLogger}
 * @extends {Logger}
 */
class DerivedLogger extends Logger {
  /**
   * Create a new class derived logger for which the levels can be attached to
   * the prototype of. This is a V8 optimization that is well know to increase
   * performance of prototype functions.
   * @param {!Object} options - Options for the created logger.
   */
  constructor(options) {
    super(options);
    this._setupLevels();
  }

  /**
   * Create the log level methods for the derived logger.
   * @returns {undefined}
   * @private
   */
  _setupLevels() {
    Object.keys(this.levels).forEach(level => {
      debug('Define prototype method for "%s"', level);
      if (level === 'log') {
        // eslint-disable-next-line no-console
        console.warn('Level "log" not defined: conflicts with the method "log". Use a different level name.');
        return;
      }

      // Define prototype methods for each log level
      // e.g. logger.log('info', msg) <––> logger.info(msg) & logger.isInfoEnabled()
      this[level] = (...args) => {
        // Optimize the hot-path which is the single object.
        if (args.length === 1) {
          const [msg] = args;
          const info = msg && msg.message && msg || { message: msg };
          info.level = info[LEVEL] = level;
          this.write(info);
          return this;
        }

        // Otherwise build argument list which could potentially conform to
        // either:
        // . v3 API: log(obj)
        // 2. v1/v2 API: log(level, msg, ... [string interpolate], [{metadata}], [callback])
        return this.log(level, ...args);
      };

      this[isLevelEnabledFunctionName(level)] = () => this.isLevelEnabled(level);
    });
  }
}

function isLevelEnabledFunctionName(level) {
  return 'is' + level.charAt(0).toUpperCase() + level.slice(1) + 'Enabled';
}

/**
 * Create a new instance of a winston Logger. Creates a new
 * prototype for each instance.
 * @param {!Object} opts - Options for the created logger.
 * @returns {Logger} - A newly created logger instance.
 */
module.exports = (opts = { levels: config.npm.levels }) => (
  new DerivedLogger(opts)
);
