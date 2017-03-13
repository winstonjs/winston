/*
 * exception-handler.js: Object for handling uncaughtException events.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

'use strict';

var os = require('os'),
    async = require('async'),
    once = require('one-time'),
    stackTrace = require('stack-trace');

var ExceptionHandler = module.exports = function (logger) {
  if (!logger) {
    throw new Error('Logger is required to handle exceptions');
  }

  this.logger = logger;
  this.handlers = new Set();
};

/*
 * function handle ([tr0, tr1...] || tr0, tr1, ...)
 * Handles `uncaughtException` events for the current process by
 * ADDING any handlers passed in.
 */
ExceptionHandler.prototype.handle = function () {
  var args = Array.prototype.slice.call(arguments),
      self = this;

  //
  // Helper function
  //
  function add(handler) {
    if (!self.handlers.has(handler)) {
      handler.handleExceptions = true;
      self.handlers.add(handler);
      //
      // TODO: What do we do to get log data to
      // to the handler?
      //
    }
  }

  args.forEach(function (arg) {
    if (Array.isArray(arg)) {
      return arg.forEach(add);
    }

    add(arg);
  });

  if (!this.catcher) {
    this.catcher = this._uncaughtException.bind(this);
    process.on('uncaughtException', this.catcher);
  }
};

/*
 * function unhandle ()
 *
 * Removes any handlers to `uncaughtException` events
 * for the current process. This DOES NOT modify the
 * state of the `this.handlers` Set.
 */
ExceptionHandler.prototype.unhandle = function () {
  if (this.catcher) {
    process.removeListener('uncaughtException', this.catcher);
    this.catcher = false;
  }
};

/*
 * function getAllInfo (err)
 * @param {Error} err Error to get information about.
 */
ExceptionHandler.prototype.getAllInfo = function (err) {
  var message = err.message;
  if (!message && typeof err === 'string') {
    message = err;
  }

  return {
    error:   err,
    //
    // TODO: how do we configure this?
    //
    level: 'error',
    message: [
      'uncaughtException: ' + (message || '(no error message)'),
      err.stack || '  No stack trace'
    ].join('\n'),
    stack:   err.stack,
    exception: true,
    date:    new Date().toString(),
    process: this.getProcessInfo(),
    os:      this.getOsInfo(),
    trace:   this.getTrace(err)
  };
};

/*
 * function getProcessInfo()
 * Gets all relevant process information for the currently
 * running process.
 */
ExceptionHandler.prototype.getProcessInfo = function () {
  return {
    pid:         process.pid,
    uid:         process.getuid ? process.getuid() : null,
    gid:         process.getgid ? process.getgid() : null,
    cwd:         process.cwd(),
    execPath:    process.execPath,
    version:     process.version,
    argv:        process.argv,
    memoryUsage: process.memoryUsage()
  };
};

/*
 * function getOsInfo()
 * Gets all relevant OS information for the currently
 * running process.
 */
ExceptionHandler.prototype.getOsInfo = function () {
  return {
    loadavg: os.loadavg(),
    uptime:  os.uptime()
  };
};

/*
 * function getTrace(err)
 * Gets a stack trace for the specified error.
 */
ExceptionHandler.prototype.getTrace = function (err) {
  var trace = err ? stackTrace.parse(err) : stackTrace.get();
  return trace.map(function (site) {
    return {
      column:   site.getColumnNumber(),
      file:     site.getFileName(),
      function: site.getFunctionName(),
      line:     site.getLineNumber(),
      method:   site.getMethodName(),
      native:   site.isNative(),
    }
  });
};

/*
 * function _uncaughtException (err)
 * @param {Error} err Error to handle
 *
 * Logs all relevant information around the `err` and
 * exits the current process.
 *
 * @api private
 */
ExceptionHandler.prototype._uncaughtException = function (err) {
  var self = this,
      info = this.getAllInfo(err),
      handlers = this._getExceptionHandlers(),
      timeout,
      doExit;

  //
  // Calculate if we should exit on this error
  //
  doExit = typeof this.logger.exitOnError === 'function'
    ? this.logger.exitOnError(err)
    : this.logger.exitOnError;

  if (!handlers.length && doExit) {
    console.warn('winston: exitOnError cannot be false with no exception handlers.');
    console.warn('winston: exiting process.');
    doExit = false;
  }

  function gracefulExit() {
    if (doExit && !process._exiting) {
      //
      // Remark: Currently ignoring any exceptions from transports
      // when catching uncaught exceptions.
      //
      if (timeout) { clearTimeout(timeout); }
      process.exit(1);
    }
  }

  if (!handlers || handlers.length === 0) {
    return process.nextTick(gracefulExit);
  }

  //
  // Log to all transports attempting to listen
  // for when they are completed.
  //
  async.forEach(handlers, function awaitLog(transport, next) {
    //
    // TODO: Change these to the correct WritableStream events
    // so that we wait until exit.
    //
    var done = once(next);

    transport.once('logged', done);
    transport.once('error', done);
  }, gracefulExit);

  this.logger.log(info);

  //
  // If exitOnError is true, then only allow the logging of
  // exceptions to take up to `3000ms`.
  //
  if (doExit) {
    timeout = setTimeout(gracefulExit, 3000);
  }
};

/*
 * function _getExceptionHandlers ()
 *
 * Returns the list of transports and exceptionHandlers
 * for this instance.
 *
 * @api private
 */
ExceptionHandler.prototype._getExceptionHandlers = function () {
  return Array.from(this.handlers.values()).concat(
    this.logger.transports.filter(function (wrap) {
      var transport = wrap.transport || wrap;
      return transport.handleExceptions;
    }));
};
