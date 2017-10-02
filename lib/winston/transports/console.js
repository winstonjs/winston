/*
 * console.js: Transport for outputting to the console
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

const os = require('os');
const util = require('util');
const { LEVEL, MESSAGE } = require('triple-beam');
const TransportStream = require('winston-transport');

//
// ### function Console (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var Console = module.exports = function (options) {
  options = options || {};
  TransportStream.call(this, options);

  this.stderrLevels = getStderrLevels(options.stderrLevels, options.debugStdout);
  this.eol = options.eol || os.EOL;

  //
  // Convert stderrLevels into an Object for faster key-lookup times than an Array.
  //
  // For backwards compatibility, stderrLevels defaults to ['error', 'debug']
  // or ['error'] depending on whether options.debugStdout is true.
  //
  function getStderrLevels(levels, debugStdout) {
    var defaultMsg = 'Cannot have non-string elements in stderrLevels Array';
    if (debugStdout) {
      if (levels) {
        //
        // Don't allow setting both debugStdout and stderrLevels together,
        // since this could cause behaviour a programmer might not expect.
        //
        throw new Error('Cannot set debugStdout and stderrLevels together');
      }

      return stringArrayToSet(['error'], defaultMsg);
    }

    if (!levels) {
      return stringArrayToSet(['error', 'debug'], defaultMsg);
    } else if (!(Array.isArray(levels))) {
      throw new Error('Cannot set stderrLevels to type other than Array');
    }

    return stringArrayToSet(levels, defaultMsg);
  }
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Console, TransportStream);

//
// Expose the name of this Transport on the prototype
//
Console.prototype.name = 'console';

//
// ### function log (info)
// #### @info {Object} **Optional** Additional metadata to attach
// Core logging method exposed to Winston.
//
Console.prototype.log = function (info, callback) {
  var self = this;
  setImmediate(function () {
    self.emit('logged', info);
  });

  //
  // Remark: what if there is no raw...?
  //
  if (this.stderrLevels[info[LEVEL]]) {
    process.stderr.write(info[MESSAGE] + this.eol);
    if (callback) { callback(); } // eslint-disable-line
    return;
  }

  process.stdout.write(info[MESSAGE] + this.eol);
  if (callback) { callback(); } // eslint-disable-line
};

//
// ### function stringArrayToSet (array)
// #### @strArray {Array} Array of Set-elements as strings.
// #### @errMsg {string} **Optional** Custom error message thrown on invalid input.
// Returns a Set-like object with strArray's elements as keys (each with the value true).
//
function stringArrayToSet(strArray, errMsg) {
  errMsg = errMsg || 'Cannot make set from Array with non-string elements';

  return strArray.reduce(function (set, el) {
    if (typeof el !== 'string') { throw new Error(errMsg); }
    set[el] = true;
    return set;
  }, {});
}
