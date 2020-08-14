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
   * @param {boolean} useHrTime - If true, try to use timer precision in nanoseconds.
   * @private
   */
  constructor(logger, useHrTime) {
    if (!logger) {
      throw new Error('Logger is required for profiling.');
    }

    if (typeof useHrTime === 'undefined') {
      useHrTime = false;
    }

    this.logger = logger;
    this.useHrTime = useHrTime;

    if (this.useHrTime && this.hasHrTime()) {
      this.start = process.hrtime();
    } else {
      this.start = Date.now();
    }
  }

  /**
   * Ends the current timer (i.e. Profiler) instance and logs the `msg` along
   * with the duration since creation.
   * @returns {mixed} - TODO: add return description.
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

    if (this.useHrTime && this.hasHrTime()) {
      const [seconds, nanoseconds] = process.hrtime(this.start);
      info.durationMs = seconds * 1000 + nanoseconds / 1000000;
    } else {
      info.durationMs = (Date.now()) - this.start;
    }

    return this.logger.write(info);
  }

  /**
   * @returns {boolean} - Returns `true` if `process.hrtime` is available.
   * @private
   */
  hasHrTime() {
    return typeof process !== 'undefined' && typeof process.hrtime === 'function';
  }
};
