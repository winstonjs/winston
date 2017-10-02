/*
 * exception-handler.js: Object for handling uncaughtException events.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

'use strict';

const os = require('os');
const async = require('async');
const debug = require('diagnostics')('winston:exception');
const once = require('one-time');
const stackTrace = require('stack-trace');
const ExceptionStream = require('./exception-stream');

var ExceptionHandler = module.exports = function (logger) {
  if (!logger) {
    throw new Error('Logger is required to handle exceptions');
  }

  this.logger = logger;
  this.handlers = new Map();
};

/*
 * function handle ([tr0, tr1...] || tr0, tr1, ...)
 * Handles `uncaughtException` events for the current process by
 * ADDING any handlers passed in.
 */
ExceptionHandler.prototype.handle = function () {
  const self = this;
  const args = Array.prototype.slice.call(arguments);

  //
  // Helper function
  //
  function add(handler) {
    var wrapper;
    if (!self.handlers.has(handler)) {
      handler.handleExceptions = true;
      wrapper = new ExceptionStream(handler);
      self.handlers.set(handler, wrapper);
      self.logger.pipe(wrapper);
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
  var self = this;
  if (this.catcher) {
    process.removeListener('uncaughtException', this.catcher);
    this.catcher = false;

    Array.from(this.handlers.values()).forEach(function (wrapper) {
      self.logger.unpipe(wrapper);
    });
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
    error: err,
    //
    // TODO (indexzero): how do we configure this?
    //
    level: 'error',
    message: [
      'uncaughtException: ' + (message || '(no error message)'),
      err.stack || '  No stack trace'
    ].join('\n'),
    stack: err.stack,
    exception: true,
    date: new Date().toString(),
    process: this.getProcessInfo(),
    os: this.getOsInfo(),
    trace: this.getTrace(err)
  };
};

/*
 * function getProcessInfo()
 * Gets all relevant process information for the currently
 * running process.
 */
ExceptionHandler.prototype.getProcessInfo = function () {
  return {
    pid: process.pid,
    uid: process.getuid ? process.getuid() : null,
    gid: process.getgid ? process.getgid() : null,
    cwd: process.cwd(),
    execPath: process.execPath,
    version: process.version,
    argv: process.argv,
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
    uptime: os.uptime()
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
      column: site.getColumnNumber(),
      file: site.getFileName(),
      function: site.getFunctionName(),
      line: site.getLineNumber(),
      method: site.getMethodName(),
      native: site.isNative()
    };
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
  const info = this.getAllInfo(err);
  const handlers = this._getExceptionHandlers();
  let timeout;
  let doExit;

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
    debug('doExit', doExit);
    debug('process._exiting', process._exiting);

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
  async.forEach(handlers, function awaitLog(handler, next) {
    //
    // TODO: Change these to the correct WritableStream events
    // so that we wait until exit.
    //
    var done = once(next);
    var transport = handler.transport || handler;

    //
    // Debug wrapping so that we can inspect what's going on
    // under the covers.
    //
    function onDone(event) {
      return function () {
        debug(event);
        done();
      };
    }

    transport.once('logged', onDone('logged'));
    transport.once('error', onDone('error'));
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
  //
  // Remark (indexzero): since `logger.transports` returns all of the pipes
  // from the _readableState of the stream we actually get the join of the
  // explicit handlers and the implicit transports with `handleExceptions: true`
  //
  return this.logger.transports.filter(function (wrap) {
    var transport = wrap.transport || wrap;
    return transport.handleExceptions;
  });
};
