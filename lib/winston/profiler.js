
//
// ### @private Profiler
// Constructor function for the Profiler instance used by
// `LogStream.prototype.startTimer`. When done is called the timer
// will finish and log the duration.
//
function Profiler(logger) {
  this.logger = logger;
  this.start = Date.now();
}

//
// ### function done (msg)
// Ends the current timer (i.e. Profiler) instance and
// logs the `msg` along with the duration since creation.
//
Profiler.prototype.done = function (msg) {
  var args     = Array.prototype.slice.call(arguments),
      callback = typeof args[args.length - 1] === 'function' ? args.pop() : null,
      meta     = typeof args[args.length - 1] === 'object' ? args.pop() : {};

  meta.duration = (Date.now()) - this.start + 'ms';
  return this.logger.info(msg, meta, callback);
};
