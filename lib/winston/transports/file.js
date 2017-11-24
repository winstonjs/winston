/*
 * file.js: Transport for outputting to a local log file
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const async = require('async');
const zlib = require('zlib');
const { MESSAGE } = require('triple-beam');
const Stream = require('stream').Stream;
const TransportStream = require('winston-transport');
const PassThrough = require('stream').PassThrough;
const debug = require('diagnostics')('winston:file');
const os = require('os');
const common = require('../common');

var noop = function () {};

//
// ### function File (options)
// #### @options {Object} Options for this instance.
// Constructor function for the File transport object responsible
// for persisting log messages and metadata to one or more files.
//
var File = module.exports = function (options) {
  options = options || {};
  TransportStream.call(this, options);

  //
  // Helper function which throws an `Error` in the event
  // that any of the rest of the arguments is present in `options`.
  //
  function throwIf(target /* , illegal... */) {
    Array.prototype.slice.call(arguments, 1).forEach(function (name) {
      if (options[name]) {
        throw new Error('Cannot set ' + name + ' and ' + target + 'together');
      }
    });
  }

  //
  // Setup the base stream that always gets piped to to handle buffering
  //
  this._stream = new PassThrough();

  //
  // Bind this context for listener functions
  //
  this._onDrain = this._onDrain.bind(this);
  this._onError = this._onError.bind(this);

  if (options.filename || options.dirname) {
    throwIf('filename or dirname', 'stream');
    this._basename = this.filename = options.filename
      ? path.basename(options.filename)
      : 'winston.log';

    this.dirname = options.dirname || path.dirname(options.filename);
    this.options = options.options || { flags: 'a' };
  } else if (options.stream) {
    console.warn('options.stream will be removed in winston@4. Use winston.transports.Stream');
    throwIf('stream', 'filename', 'maxsize');
    this._dest = this._stream.pipe(this._setupStream(options.stream));
    //
    // We need to listen for drain events when
    // write() returns false. This can make node
    // mad at times.
    //
  } else {
    throw new Error('Cannot log to file without filename or stream.');
  }

  this.maxsize     = options.maxsize     || null;
  this.rotationFormat = options.rotationFormat || false;
  this.zippedArchive = options.zippedArchive || false;
  this.maxFiles    = options.maxFiles    || null;
  this.eol         = options.eol || os.EOL;
  this.tailable    = options.tailable    || false;

  //
  // Internal state variables representing the number
  // of files this instance has created and the current
  // size (in bytes) of the current logfile.
  //
  this._size     = 0;
  this._created  = 0;
  this._drains   = 0;
  this._next     = noop;
  this._opening  = false;

  this.open();
};

//
// Inherit from `winston.Transport`.
//
util.inherits(File, TransportStream);

//
// Expose the name of this Transport on the prototype
//
File.prototype.name = 'file';

//
// function log (info)
// @param {Object} info All relevant log information
// Core logging method exposed to Winston. Metadata is optional.
//
File.prototype.log = function (info, callback) {
  callback = callback || noop;

  //
  // Remark: (jcrugzz) What is necessary about this callback(null, true) now
  // when thinking about 3.x? Should silent be handled in the base
  // TransportStream _write method?
  //
  if (this.silent) {
    callback();
    return true;
  }

  //
  // Grab the raw string and append the expected EOL
  //
  var self = this;
  var output = info[MESSAGE] + this.eol;

  //
  // This gets called too early and does not depict when data has been flushed
  // to disk like I want it to
  //
  function logged() {
    self._size += Buffer.byteLength(output);
    self.emit('logged', info);

    //
    // Check to see if we need to end the stream and create a new one
    //
    if (!self._needsNewFile()) { return; }

    //
    // End the current stream, ensure it flushes and create a new one.
    // TODO: This could probably be optimized to not run a stat call but its
    // the safest way since we are supporting `maxFiles`.
    // Remark: We could call `open` here but that would incur an extra unnecessary stat call
    //
    self._endStream(function () { self._nextFile(); });
  }

  var written = this._stream.write(output, logged);
  if (written === false) ++this._drains;
  if (!this._drains) callback(); // eslint-disable-line
  else this._next = callback;

  return written;
};

//
// ### function query (options, callback)
// #### @options {Object} Loggly-like query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport. Options object is optional.
// TODO: Refactor me
//
File.prototype.query = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = this.normalizeQuery(options);
  const file = path.join(this.dirname, this.filename);
  let buff = '';
  let results = [];
  let row = 0;

  var stream = fs.createReadStream(file, {
    encoding: 'utf8'
  });

  stream.on('error', function (err) {
    if (stream.readable) {
      stream.destroy();
    }
    if (!callback) return;
    return err.code !== 'ENOENT'
      ? callback(err)
      : callback(null, results);
  });

  stream.on('data', function (data) {
    data = (buff + data).split(/\n+/);
    const l = data.length - 1;
    let i = 0;

    for (; i < l; i++) {
      if (!options.start || row >= options.start) {
        add(data[i]);
      }
      row++;
    }

    buff = data[l];
  });

  stream.on('close', function () {
    if (buff) add(buff, true);
    if (options.order === 'desc') {
      results = results.reverse();
    }

    // eslint-disable-next-line callback-return
    if (callback) callback(null, results);
  });

  function add(buff, attempt) {
    try {
      var log = JSON.parse(buff);
      if (check(log)) push(log);
    } catch (e) {
      if (!attempt) {
        stream.emit('error', e);
      }
    }
  }

  function push(log) {
    if (options.rows && results.length >= options.rows
        && options.order !== 'desc') {
      if (stream.readable) {
        stream.destroy();
      }
      return;
    }

    if (options.fields) {
      var obj = {};
      options.fields.forEach(function (key) {
        obj[key] = log[key];
      });
      log = obj;
    }

    if (options.order === 'desc') {
      if (results.length >= options.rows) {
        results.shift();
      }
    }
    results.push(log);
  }

  function check(log) {
    if (!log) return;

    if (typeof log !== 'object') return;

    var time = new Date(log.timestamp);
    if ((options.from && time < options.from)
        || (options.until && time > options.until)
        || (options.level && options.level !== log.level)) {
      return;
    }

    return true;
  }
};

//
// ### function stream (options)
// #### @options {Object} Stream options for this instance.
// Returns a log stream for this transport. Options object is optional.
// TODO: Refactor me
//
File.prototype.stream = function (options) {
  options = options || {};
  const file = path.join(this.dirname, this.filename);
  const stream = new Stream();

  const tail = {
    file: file,
    start: options.start
  };

  stream.destroy = common.tailFile(tail, function (err, line) {
    if (err) {
      return stream.emit('error', err);
    }

    try {
      stream.emit('data', line);
      line = JSON.parse(line);
      stream.emit('log', line);
    } catch (e) {
      stream.emit('error', e);
    }
  });

  return stream;
};

//
// ### function stat
// Checks to see the filesize of
//
File.prototype.open = function open() {
  var self = this;

  //
  // If we do not have a filename then we were passed a stream
  // and dont need to keep track of size
  //
  if (!this.filename) { return; }
  if (this.opening) { return; }
  this.opening = true;

  //
  // Stat the target file to get the size and create the stream
  //
  this.stat(function (err, size) {
    if (err) return self.emit('error', err);

    debug('stat done', self.filename);
    self._size = size;
    self._createStream();
    self.opening = false;
  });
};

//
// ### function stat
// Stat the file and assess information in order to create the proper stream
//
File.prototype.stat = function stat(callback) {
  var self = this;
  var target = this._getFile();
  var fullpath = path.join(this.dirname, target);

  fs.stat(fullpath, function (err, stat) {
    if (err && err.code === 'ENOENT') {
      debug('err ENOENT', fullpath);
      return callback(null, 0);
    }

    if (err) {
      debug('err ' + err.code, fullpath);
      return callback(err);
    }

    if (!stat || self._needsNewFile(stat.size)) {
      //
      // If `stats.size` is greater than the `maxsize` for
      // this instance then try again
      //
      return self._incFile(function () { self.stat(callback); });
    }
    //
    // Once we have figured out what the filename is, set it and return the
    // size
    //
    self.filename = target;
    callback(null, stat.size);
  });
};

//
// ### function close ()
// Closes the stream associated with this instance.
//
File.prototype.close = function (cb) {
  var self = this;

  if (!this._stream) return;

  this._stream.end(function () {
    // eslint-disable-next-line callback-return
    if (cb) cb();
    self.emit('flush');
    self.emit('closed');
  });
};

File.prototype._needsNewFile = function (size) {
  size = size || this._size;
  return this.maxsize && size >= this.maxsize;
};

File.prototype._onDrain = function onDrain() {
  if (--this._drains) return;
  var next = this._next;
  this._next = noop;
  next();
};

File.prototype._onError = function onError(err) {
  this.emit('error', err);
};

File.prototype._setupStream = function (stream) {
  stream.on('error', this._onError);
  stream.on('drain', this._onDrain);
  return stream;
};

File.prototype._cleanupStream = function (stream) {
  stream.removeListener('error', this._onError);
  stream.removeListener('drain', this._onDrain);
  return stream;
};

File.prototype._nextFile = function nextFile() {
  var self = this;
  return this._incFile(function () { self.open(); });
};

//
// ### @private function endStream
// #### @param {function} callback
// Unpipe from the stream that has been marked as FULL
// and end it so it flushes to disk
//
File.prototype._endStream = function endStream(callback) {
  var self = this;
  this._stream.unpipe(this._dest);

  this._dest.end(function () {
    self._cleanupStream(self._dest);
    callback();
  });
};

//
// ### @private function _createStream ()
//
File.prototype._createStream = function () {
  var self = this;
  var fullpath = path.join(this.dirname, this.filename);

  debug('create stream start', fullpath);
  this._dest = fs.createWriteStream(fullpath, this.options)
    .on('error', function (err) {
      // TODO: what should we do with errors here?
      debug(err);
    })
    .on('drain', this._onDrain)
    .on('open', function () {
      debug('file open ok', fullpath);
      self.emit('open');
      self._stream.pipe(self._dest);
    });

  debug('create stream ok', fullpath);
  if (this.zippedArchive) {
    var gzip = zlib.createGzip();
    gzip.pipe(this._dest);
    this._dest = gzip;
  }
};

File.prototype._incFile = function (callback) {
  const ext = path.extname(this._basename);
  const basename = path.basename(this._basename, ext);

  if (!this.tailable) {
    this._created += 1;
    this._checkMaxFilesIncrementing(ext, basename, callback);
  } else {
    this._checkMaxFilesTailable(ext, basename, callback);
  }
};

//
// ### @private function _getFile ()
// Gets the next filename to use for this instance
// in the case that log filesizes are being capped.
//
File.prototype._getFile = function () {
  const ext = path.extname(this._basename);
  const basename = path.basename(this._basename, ext);

  //
  // Caveat emptor (indexzero): rotationFormat() was broken by design
  // when combined with max files because the set of files to unlink
  // is never stored.
  //
  var target = !this.tailable && this._created
    ? basename + (this.rotationFormat ? this.rotationFormat() : this._created) + ext
    : basename + ext;

  return this.zippedArchive
    ? target + '.gz'
    : target;
};

//
// ### @private function _checkMaxFilesIncrementing ()
// Increment the number of files created or
// checked by this instance.
//
File.prototype._checkMaxFilesIncrementing = function (ext, basename, callback) {
  // Check for maxFiles option and delete file
  if (!this.maxFiles || this._created < this.maxFiles) {
    return callback();
  }

  const oldest = this._created - this.maxFiles;
  const target = path.join(this.dirname, basename + (oldest !== 0 ? oldest : '') + ext +
    (this.zippedArchive ? '.gz' : ''));

  fs.unlink(target, callback);
};

//
// ### @private function _checkMaxFilesTailable ()
//
// Roll files forward based on integer, up to maxFiles.
// e.g. if base if file.log and it becomes oversized, roll
//    to file1.log, and allow file.log to be re-used. If
//    file is oversized again, roll file1.log to file2.log,
//    roll file.log to file1.log, and so on.
File.prototype._checkMaxFilesTailable = function (ext, basename, callback) {
  const tasks = [];
  const self = this;

  if (!this.maxFiles) {
    return;
  }

  for (var x = this.maxFiles - 1; x > 0; x--) {
    tasks.push(function (i) {
      return function (cb) {
        var tmppath = path.join(self.dirname, basename + (i - 1) + ext +
          (self.zippedArchive ? '.gz' : ''));
        fs.exists(tmppath, function (exists) {
          if (!exists) {
            return cb(null);
          }

          fs.rename(tmppath, path.join(self.dirname, basename + i + ext +
            (self.zippedArchive ? '.gz' : '')), cb);
        });
      };
    }(x));
  }

  async.series(tasks, function (err) { // eslint-disable-line
    fs.rename(
      path.join(self.dirname, basename + ext),
      path.join(self.dirname, basename + 1 + ext),
      callback
    );
  });
};
