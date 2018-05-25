'use strict';

/*
 * helpers.js: Test helpers for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const fs = require('fs');
const { spawn } = require('child_process');
const stream = require('stream');
const through = require('through2');
const winston = require('../../lib/winston');

const helpers = exports;

/**
 * Returns a new winston.Logger instance which will invoke
 * the `write` method on each call to `.log`
 * @param {Function} write - Write function for the specified stream
 * @param {mixed} format - TODO: add param description.
 * @returns {Logger} A winston.Logger instance
 */
helpers.createLogger = (write, format) => {
  const writeable = new stream.Writable({
    write,
    objectMode: true
  });

  return winston.createLogger({
    format,
    transports: [
      new winston.transports.Stream({ stream: writeable })
    ]
  });
};

/**
 * Returns a new writeable stream with the specified write function.
 * @param {Function} write - Write function for the specified stream
 * @param {Boolean} objectMode - TODO: add param description.
 * @returns {stream.Writeable} - A writeable stream instance
 */
helpers.writeable = (write, objectMode) => {
  return new stream.Writable({
    objectMode: objectMode !== false,
    write
  });
};

/**
 * Creates a new ExceptionHandler instance with a new
 * winston.Logger instance with the specified options
 * @param {Object} opts - Options for the logger associated
 * with the ExceptionHandler
 * @returns {ExceptionHandler} - A new ExceptionHandler instance
 */
helpers.exceptionHandler = opts => {
  const logger = winston.createLogger(opts);
  return new winston.ExceptionHandler(logger);
};

/**
 * Removes all listeners to `process.on('uncaughtException')`
 * and returns an object hat allows you to restore them later.
 * @returns {Object} - Facade to restore uncaughtException handlers.
 */
helpers.clearExceptions = () => {
  const listeners = process.listeners('uncaughtException');
  process.removeAllListeners('uncaughtException');

  return {
    restore() {
      process.removeAllListeners('uncaughtException');
      listeners.forEach(fn => {
        process.on('uncaughtException', fn);
      });
    }
  };
};

/**
 * Throws an exception with the specified `msg`
 * @param {String} msg - Error mesage to use
 * @returns {void}
 */
helpers.throw = msg => {
  throw new Error(msg);
};

/**
 * Attempts to unlink the specifyed `filename` ignoring errors
 * @param {String} filename - File Full path to attempt to unlink.
 * @returns {void}
 */
helpers.tryUnlink = filename => {
  try {
    fs.unlinkSync(filename); // eslint-disable-line no-sync
  } catch (ex) { } // eslint-disable-line no-empty
};

/**
 * Returns a stream that will emit data for the `filename` if it exists
 * and is capable of being opened.
 * @param {filename} filename - Full path to attempt to read from.
 * @returns {Stream} - Stream instance to the contents of the file
 */
helpers.tryRead = filename => {
  const proxy = through();
  (function inner() {
    const rStream = fs.createReadStream(filename)
      .once('open', () => rStream.pipe(proxy))
      .once('error', err => {
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
 * @param {Object} obj - Ordinary object to assert against.
 * @returns {void}
 */
helpers.assertProcessInfo = obj => {
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
 * @param {Object} obj - Ordinary object to assert against.
 * @returns {void}
 */
helpers.assertOsInfo = obj => {
  assume(obj.loadavg).is.an('array');
  assume(obj.uptime).is.a('number');
};

/**
 * Assumes the trace structure associated with an ExceptionHandler
 * for the `trace` provided.
 * @param {Object} trace - Ordinary object to assert against.
 * @returns {void}
 */
helpers.assertTrace = trace => {
  trace.forEach(site => {
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
 * @param {Logger} logger - `winston` Logger to assert against
 * @param {String} level - Target level logger is expected at.
 * @returns {void}
 */
helpers.assertLogger = (logger, level) => {
  assume(logger).instanceOf(winston.Logger);
  assume(logger.log).is.a('function');
  assume(logger.add).is.a('function');
  assume(logger.remove).is.a('function');
  assume(logger.level).equals(level || 'info');
  Object.keys(logger.levels).forEach(method => {
    assume(logger[method]).is.a('function');
  });
};

/**
 * Asserts that the script located at `options.script` logs a single exception
 * (conforming to the ExceptionHandler structure) at the specified `options.logfile`.
 * @param {Object} options - Configuration for this test.
 * @returns {Function} - Test macro asserting that `options.script` performs the
 * expected behavior.
 */
helpers.assertHandleExceptions = options => {
  return done => {
    const child = spawn('node', [options.script]);

    if (process.env.DEBUG) { // eslint-disable-line no-process-env
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stdout);
    }

    helpers.tryUnlink(options.logfile);
    child.on('exit', () => {
      fs.readFile(options.logfile, (err, data) => {
        assume(err).equals(null);
        data = JSON.parse(data);

        assume(data).is.an('object');
        helpers.assertProcessInfo(data.process);
        helpers.assertOsInfo(data.os);
        helpers.assertTrace(data.trace);
        if (options.message) {
          assume(data.message).include(`uncaughtException: ${options.message}`);
        }

        done();
      });
    });
  };
};
