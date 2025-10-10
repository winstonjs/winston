/*
 * helpers.js: Test helpers for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume'),
    fs = require('fs'),
    through = require('through2'),
    spawn = require('child_process').spawn,
    stream = require('stream'),
    winston = require('../../lib/winston'),
    mockTransport = require('./mocks/mock-transport');

var helpers = exports;

/**
 * Returns a new winston.Logger instance which will invoke
 * the `write` method on each call to `.log`
 *
 * @param {function} write Write function for the specified stream
 * @returns {Logger} A winston.Logger instance
 */
helpers.createLogger = function (write, format, defaultMeta) {
  return winston.createLogger({
    format,
    defaultMeta,
    transports: [
      mockTransport.createMockTransport(write)
    ]
  });
};

/**
 * Returns a new writeable stream with the specified write function.
 * @param {function} write Write function for the specified stream
 * @returns {stream.Writeable} A writeable stream instance
 */
helpers.writeable = function (write, objectMode) {
  return new stream.Writable({
    objectMode: objectMode !== false,
    write: write
  });
};

/**
 * Creates a new ExceptionHandler instance with a new
 * winston.Logger instance with the specified options
 *
 * @param {Object} opts Options for the logger associated
 *                 with the ExceptionHandler
 * @returns {ExceptionHandler} A new ExceptionHandler instance
 */
helpers.exceptionHandler = function (opts) {
  var logger = winston.createLogger(opts);
  return new winston.ExceptionHandler(logger);
};

/**
 * Creates a new RejectionHandler instance with a new
 * winston.Logger instance with the specified options
 *
 * @param {Object} opts Options for the logger associated
 *                 with the RejectionHandler
 * @returns {RejectionHandler} A new ExceptionHandler instance
 */
helpers.rejectionHandler = function (opts) {
  var logger = winston.createLogger(opts);
  return new winston.RejectionHandler(logger);
};

/**
 * Removes all listeners to `process.on('uncaughtException')`
 * and returns an object that allows you to restore them later.
 *
 * @returns {Object} Facade to restore uncaughtException handlers.
 */
helpers.clearExceptions = function () {
  var listeners = process.listeners('uncaughtException');
  process.removeAllListeners('uncaughtException');

  return {
    restore: function () {
      process.removeAllListeners('uncaughtException');
      listeners.forEach(function (fn) {
        process.on('uncaughtException', fn);
      });
    }
  };
};

/**
 * Removes all listeners to `process.on('unhandledRejection')`
 * and returns an object that allows you to restore them later.
 *
 * @returns {Object} Facade to restore unhandledRejection handlers.
 */
helpers.clearRejections = function () {
  var listeners = process.listeners('unhandledRejection');
  process.removeAllListeners('unhandledRejection');

  return {
    restore: function () {
      process.removeAllListeners('unhandledRejection');
      listeners.forEach(function (fn) {
        process.on('unhandledRejection', fn);
      });
    }
  };
};


/**
 * Attempts to unlink the specifyed `filename` ignoring errors
 * @param {String} File Full path to attempt to unlink.
 */
helpers.tryUnlink = function (filename) {
  try {
    fs.unlinkSync(filename);
  } catch (ex) {}
};

/**
 * Returns a stream that will emit data for the `filename` if it exists
 * and is capable of being opened.
 * @param  {filename} Full path to attempt to read from.
 * @returns {Stream} Stream instance to the contents of the file
 */
helpers.tryRead = function tryRead(filename) {
  var proxy = through();
  (function inner() {
    var stream = fs
      .createReadStream(filename)
      .once('open', function () {
        stream.pipe(proxy);
      })
      .once('error', function (err) {
        if (err.code === 'ENOENT') {
          return setImmediate(inner);
        }
        proxy.emit('error', err);
      });
  }());

  return proxy;
};

/**
 * Assumes the process structure associated with an ExceptionHandler
 * for the `obj` provided.
 * @param  {Object} obj Ordinary object to assert against.
 */
helpers.assertProcessInfo = function (obj) {
  assume(obj.pid).is.a('number');
  // `process.gid` and `process.uid` do no exist on Windows.
  if (process.platform === 'win32') {
    assume(obj.uid).is.a('null');
    assume(obj.gid).is.a('null');
  } else {
    assume(obj.uid).is.a('number');
    assume(obj.gid).is.a('number');
  }
  assume(obj.cwd).is.a('string');
  assume(obj.execPath).is.a('string');
  assume(obj.version).is.a('string');
  assume(obj.argv).is.an('array');
  assume(obj.memoryUsage).is.an('object');
};

/**
 * Assumes the OS structure associated with an ExceptionHandler
 * for the `obj` provided.
 * @param  {Object} obj Ordinary object to assert against.
 */
helpers.assertOsInfo = function (obj) {
  assume(obj.loadavg).is.an('array');
  assume(obj.uptime).is.a('number');
};

/**
 * Assumes the trace structure associated with an ExceptionHandler
 * for the `trace` provided.
 * @param  {Object} trace Ordinary object to assert against.
 */
helpers.assertTrace = function (trace) {
  trace.forEach(function (site) {
    assume(!site.column || typeof site.column === 'number').true();
    assume(!site.line || typeof site.line === 'number').true();
    assume(!site.file || typeof site.file === 'string').true();
    assume(!site.method || typeof site.method === 'string').true();
    assume(!site.function || typeof site.function === 'string').true();
    assume(typeof site.native === 'boolean').true();
  });
};

/**
 * Assumes the `logger` provided is a `winston.Logger` at the specified `level`.
 * @param  {Logger} logger `winston` Logger to assert against
 * @param  {String} level Target level logger is expected at.
 */
helpers.assertLogger = function (logger, level) {
  assume(logger).instanceOf(winston.Logger);
  assume(logger.log).is.a('function');
  assume(logger.add).is.a('function');
  assume(logger.remove).is.a('function');
  assume(logger.level).equals(level || 'info');
  Object.keys(logger.levels).forEach(function (method) {
    assume(logger[method]).is.a('function');
  });
};

