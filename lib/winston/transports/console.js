/* eslint-disable no-console */
/*
 * console.js: Transport for outputting to the console.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const os = require('os');
const { LEVEL, MESSAGE } = require('triple-beam');
const TransportStream = require('winston-transport');

/**
 * Transport for outputting to the console.
 * @type {Console}
 * @extends {TransportStream}
 */
module.exports = class Console extends TransportStream {
  /**
   * Constructor function for the Console transport object responsible for
   * persisting log messages and metadata to a terminal or TTY.
   * @param {!Object} [options={}] - Options for this instance.
   */
  constructor(options = {}) {
    super(options);

    // Expose the name of this Transport on the prototype
    this.name = 'console';
    this.stderrLevels = this._getStderrLevels(
      options.stderrLevels,
      options.debugStdout
    );
    this.eol = options.eol || os.EOL;
  }

  /**
   * Core logging method exposed to Winston.
   * @param {Object} info - TODO: add param description.
   * @param {Function} callback - TODO: add param description.
   * @returns {undefined}
   */
  log(info, callback) {
    setImmediate(() => this.emit('logged', info));

    // Remark: what if there is no raw...?
    if (this.stderrLevels[info[LEVEL]]) {
      if (console._stderr) {
        // Node.js maps `process.stderr` to `console._stderr`.
        console._stderr.write(`${info[MESSAGE]}${this.eol}`);
      } else {
        // console.error adds a newline
        console.error(info[MESSAGE]);
      }

      if (callback) {
        callback(); // eslint-disable-line callback-return
      }
      return;
    }

    if (console._stdout) {
      // Node.js maps `process.stdout` to `console._stdout`.
      console._stdout.write(`${info[MESSAGE]}${this.eol}`);
    } else {
      // console.log adds a newline.
      console.log(info[MESSAGE]);
    }

    if (callback) {
      callback(); // eslint-disable-line callback-return
    }
  }

  /**
   * Convert stderrLevels into an Object for faster key-lookup times than an
   * Array. For backwards compatibility, stderrLevels defaults to
   * ['error', 'debug'] or ['error'] depending on whether options.debugStdout
   * is true.
   * @param {mixed} levels - TODO: add param description.
   * @param {mixed} debugStdout - TODO: add param description.
   * @returns {mixed} - TODO: add return description.
   * @private
   */
  _getStderrLevels(levels, debugStdout) {
    const defaultMsg = 'Cannot have non-string elements in stderrLevels Array';
    if (debugStdout) {
      if (levels) {
        // Don't allow setting both debugStdout and stderrLevels together,
        // since this could cause behaviour a programmer might not expect.
        throw new Error('Cannot set debugStdout and stderrLevels together');
      }

      return this._stringArrayToSet(['error'], defaultMsg);
    }

    if (!levels) {
      return this._stringArrayToSet(['error', 'debug'], defaultMsg);
    } else if (!(Array.isArray(levels))) {
      throw new Error('Cannot set stderrLevels to type other than Array');
    }

    return this._stringArrayToSet(levels, defaultMsg);
  }

  /**
   * Returns a Set-like object with strArray's elements as keys (each with the
   * value true).
   * @param {Array} strArray - Array of Set-elements as strings.
   * @param {?string} [errMsg] - Custom error message thrown on invalid input.
   * @returns {Object} - TODO: add return description.
   * @private
   */
  _stringArrayToSet(strArray, errMsg) {
    errMsg = errMsg || 'Cannot make set from Array with non-string elements';

    return strArray.reduce((set, el) =>  {
      if (typeof el !== 'string') {
        throw new Error(errMsg);
      }
      set[el] = true;

      return set;
    }, {});
  }
};
