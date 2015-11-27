/*
 * console.js: Transport for outputting to the console
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var events = require('events'),
    os = require('os'),
    util = require('util'),
    common = require('../common'),
    TransportStream = require('winston-transport');

//
// ### function Console (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var Console = module.exports = function (options) {
  options = options || {};
  TransportStream.call(this, options);

  this.stderrLevels = setStderrLevels(options.stderrLevels, options.debugStdout);
  this.eol          = options.eol   || os.EOL;

  //
  // Convert stderrLevels into an Object for faster key-lookup times than an Array.
  //
  // For backwards compatibility, stderrLevels defaults to ['error', 'debug']
  // or ['error'] depending on whether options.debugStdout is true.
  //
  function setStderrLevels (levels, debugStdout) {
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
  };
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
// ### function log (meta)
// #### @meta {Object} **Optional** Additional metadata to attach
// Core logging method exposed to Winston.
//
Console.prototype.log = function (meta) {
  if (this.stderrLevels[meta.level]) {
    process.stderr.write(meta.raw + this.eol);
  } else {
    process.stdout.write(meta.raw + this.eol);
  }
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
};
