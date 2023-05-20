/**
 * profiler.js: TODO: add file header description.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

/**
 * TODO: add class description.
 * @type {Profiler}
 * @private
 */
module.exports = class Profiler {
  /**
   * Constructor function for the Profiler instance used by
   * `Logger.prototype.startTimer`. When done is called the timer will finish
   * and log the duration.
   * @param {!Logger} logger - TODO: add param description.
   * @private
   */
  constructor(logger) {
    // TODO there is no restriction on what the Profiler considers a Logger. As such there is no guarantees it adheres
    //   to the proper interface. This needs to hardened.
    if (!logger) {
      throw new Error('Logger is required for profiling.');
    }

    this.logger = logger;
    this.start = Date.now();
  }

  /**
   * Ends the current timer (i.e. Profiler) instance and logs the `msg` along
   * with the duration since creation.
   * @returns {boolean} - `false` if the logger stream wishes for the calling code to wait for the 'drain' event to be
   *   emitted before continuing to write additional data; otherwise `true`
   * @private
   */
  done(...args) {
    if (typeof args[args.length - 1] === 'function') {
      // eslint-disable-next-line no-console
      console.warn('Callback function no longer supported as of winston@3.0.0');
      args.pop();
    }

    const info = typeof args[args.length - 1] === 'object' ? args.pop() : {};
    info.level = info.level || 'info';
    info.durationMs = (Date.now()) - this.start;
    if (this.logger._addDefaultMeta) this.logger._addDefaultMeta(info);
    return this.logger.write(info);
  }
};
