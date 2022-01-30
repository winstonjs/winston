'use strict'

const events = require('events');
const util = require('util')
const Transport = require('../../../').Transport;

//
// ### function LegacyMixed (options)
// #### @options {Object} Options for this instance.
// Constructor function for the LegacyMixed transport object responsible
// for persisting log messages and metadata to a memory array of messages
// and conforming to the old winston transport API, **BUT** INHERITS FROM
// THE MODERN WINSTON TRANSPORT.
//
module.exports = class LegacyMixed extends Transport {
  constructor(options = {}) {
    super(options);

    //
    // Expose the name of this Transport on the prototype
    //
    module.exports.prototype.name = 'legacy-mixed-test';

    this.silent = options.silent;
    this.output = { error: [], write: [] };
  }

  //
  // ### function log (level, msg, [meta], callback)
  // #### @level {string} Level at which to log the message.
  // #### @msg {string} Message to log
  // #### @meta {Object} **Optional** Additional metadata to attach
  // #### @callback {function} Continuation to respond to when complete.
  // Core logging method exposed to Winston. Metadata is optional.
  //
  log(level, msg, meta, callback) {
    if (this.silent) {
      return callback(null, true);
    }

    var output = 'I AM BACKWARDS COMPATIBLE WITH LEGACY';

    if (level === 'error' || level === 'debug') {
      this.errorOutput.push(output);
    } else {
      this.writeOutput.push(output);
    }

    this.emit('logged');
    callback(null, true);
  }
};
