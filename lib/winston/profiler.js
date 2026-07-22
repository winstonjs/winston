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
class Profiler {
  /**
   * Constructor function for the Profiler instance used by
   * `Logger.prototype.startTimer`. When done is called the timer will finish
   * and log the duration.
   * @param {!Logger} logger - TODO: add param description.
   * @private
   */
  constructor(logger) {
    // Remark: We intentionally avoid an `instanceof Logger` check here.
    // Loading `./logger` and comparing class identity breaks whenever more
    // than one instance of the `winston` module ends up in memory (e.g. a
    // duplicated nested install, or a test runner like Jest that resets its
    // module registry between files/suites). In that situation a perfectly
    // valid `DerivedLogger` fails `instanceof` against the "wrong" copy of
    // the `Logger` class and profiling breaks for reasons unrelated to the
    // caller's code. Instead we duck-type for the shape of a winston Logger
    // (a writable stream with `.log()` and `.levels`), which still rejects
    // arbitrary values and generic streams (see profiler.test.js).
    if (
      !logger ||
      typeof logger !== 'object' ||
      Array.isArray(logger) ||
      typeof logger.write !== 'function' ||
      typeof logger.log !== 'function' ||
      typeof logger.levels !== 'object'
    ) {
      throw new Error('Logger is required for profiling');
    } else {
      this.logger = logger;
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
    info.durationMs = (Date.now()) - this.start;

    return this.logger.write(info);
  }
}

module.exports = Profiler;
