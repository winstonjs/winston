'use strict';

//
// ### @private Profiler
// Constructor function for the Profiler instance used by
// `Logger.prototype.startTimer`. When done is called the timer
// will finish and log the duration.
//
var Profiler = module.exports = function Profiler(logger) {
  if (!logger) {
    throw new Error('Logger is required for profiling.');
  }

  this.logger = logger;
  this.start = Date.now();
};

//
// ### function done (info)
// Ends the current timer (i.e. Profiler) instance and
// logs the `msg` along with the duration since creation.
//
Profiler.prototype.done = function () {
  const args = Array.prototype.slice.call(arguments);
  let info;

  if (typeof args[args.length - 1] === 'function') {
    console.warn('Callback function no longer supported as of winston@3.0.0');
    args.pop();
  }

  info = typeof args[args.length - 1] === 'object' ? args.pop() : {};
  info.level = info.level || 'info';
  info.durationMs = (Date.now()) - this.start;

  return this.logger.write(info);
};
