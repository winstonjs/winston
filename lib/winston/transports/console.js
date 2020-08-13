/* eslint-disable no-console */
/*
 * console.js: Transport for outputting to the console.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const { LEVEL, MESSAGE } = require('triple-beam');
const TransportStream = require('winston-transport');
const realConsole = require('console');
const { Console: PrivateConsole } = realConsole;

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
    this.name = options.name || 'console';
    this.stderrLevels = this._stringArrayToSet(options.stderrLevels);
    this.consoleWarnLevels = this._stringArrayToSet(options.consoleWarnLevels);
    this.privateConsole = new PrivateConsole(process.stdout, process.stderr);
    this.privateConsole.error = realConsole.error;
    this.privateConsole.warn = realConsole.warn;
    this.privateConsole.log = realConsole.log;
    this.consoleMethodMap = {};
    if (options.stderrLevels) for (const i of options.stderrLevels) this.consoleMethodMap[i] = this.privateConsole.error;
    if (options.consoleWarnLevels) for (const i of options.consoleWarnLevels) this.consoleMethodMap[i] = this.privateConsole.warn;

    this.setMaxListeners(30);
  }

  /**
   * Core logging method exposed to Winston.
   * @param {Object} info - TODO: add param description.
   * @param {Function} callback - TODO: add param description.
   * @returns {undefined}
   */
  log(info, callback) {
    setImmediate(this.emit.bind(this, 'logged', info));

    // Remark: what if there is no raw...?
    (this.consoleMethodMap[info[LEVEL]] || this.privateConsole.log)(info[MESSAGE]);

    if (callback) return void callback();
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
    if (!strArray)
      return {};

    errMsg = errMsg || 'Cannot make set from type other than Array of string elements';

    if (!Array.isArray(strArray)) {
      throw new Error(errMsg);
    }

    return strArray.reduce((set, el) =>  {
      if (typeof el !== 'string') {
        throw new Error(errMsg);
      }
      set[el] = true;

      return set;
    }, {});
  }
};
