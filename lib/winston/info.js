'use strict';

/**
 * Represents a single log message passed down through a format
 * stream pipechain
 *
 * @param {Object} info Verbatim properties passed to `Logger.prototype.log`.
 */
var Info = module.exports = function Info(info) {
  //
  // Perform a shallow clone of the `info` properties
  // into a new Object.
  //
  this.final = Object.assign({}, info);

  //
  // TODO: Should we be:
  //   - Object.freeze(info)
  //   - Providing `final` via a WeakMap reference to `info`?
  //
};

