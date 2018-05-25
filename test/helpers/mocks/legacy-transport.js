'use strict';

const { Transport } = require('winston-compat');

module.exports = class Legary extends Transport {
  /**
   * Constructor function for the Legacy transport object responsible
   * for persisting log messages and metadata to a memory array of messages
   * and conforming to the old winston transport API.
   * @param {Object} options - Options for this instance.
   */
  constructor(options = {}) {
    super(options);

    // this.silent = options.silent;
    this.output = {
      error: [],
      write: []
    };
    this.name = 'legacy-test';
  }

  /**
   * Core logging method exposed to Winston. Metadata is optional.
   * @param {String} level - Level at which to log the message.
   * @param {String} msg - Message to log
   * @param {Object} meta - **Optional** Additional metadata to attach
   * @param {Function} callback - Continuation to respond to when complete.
   * @returns {void}
   */
  log(level, msg, meta, callback) {
    if (this.silent) {
      return callback(null, true);
    }

    const output = 'I AM BACKWARDS COMPATIBLE WITH LEGACY';
    if (level === 'error' || level === 'debug') {
      this.errorOutput.push(output);
    } else {
      this.writeOutput.push(output);
    }

    this.emit('logged');
    callback(null, true);
  }
};


