/*
 * file.js: Transport for outputting to a local log file
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var events = require('events'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    async = require('async'),
    zlib = require('zlib'),
    common = require('../common'),
    TransportStream = require('winston-transport'),
    isWritable = require('isstream').isWritable,
    PassThrough = require('stream').PassThrough,
    os = require('os');

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
  function throwIf (target /*, illegal... */) {
    Array.prototype.slice.call(arguments, 1).forEach(function (name) {
      if (options[name]) {
        throw new Error('Cannot set ' + name + ' and ' + target + 'together');
      }
    });
  }

  var self = this;

  //
  // Setup the base stream that always gets piped to to handle buffering
  //
  this._stream = new PassThrough();
  this._ondrain = ondrain;
  this._onerror = onerror;

  function ondrain() {
    if (--self._drains) return;
    var next = self._next;
    self._next = noop;
    next();
  }

  function onerror(err) {
    self.emit('error', err);
  }

  if (options.filename || options.dirname) {
    throwIf('filename or dirname', 'stream');
    this._basename = this.filename = options.filename
      ? path.basename(options.filename)
      : 'winston.log';

    this.dirname = options.dirname || path.dirname(options.filename);
    this.options = options.options || { flags: 'a' };
  }
  else if (options.stream) {
    console.warn('options.stream will be removed in winston@4. Use winston.transports.Stream');
    throwIf('stream', 'filename', 'maxsize');
    this._dest = this._stream.pipe(this._setupStream(options.stream));
    //
    // We need to listen for drain events when
    // write() returns false. This can make node
    // mad at times.
    //
  }
  else {
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
  this._archive = null;

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
  //
  // Remark: (jcrugzz) What is necessary about this callback(null, true) now
  // when thinking about 3.x? Should silent be handled in the base
  // TransportStream _write method?
  //
  if (this.silent) {
    return callback();
  }

  var self = this;
  //
  // Grab the raw string and append the expected EOL
  //
  var output = info.raw + this.eol;


  if (this._stream.write(output, logged) === false) ++this._drains;

  if (!this._drains) callback();
  else this._next = callback;
  //
  // This tells us when data has been flushed to disk and then incrememnt the
  // size
  //
  function logged() {
    self._size += Buffer.byteLength(output);
    self.emit('logged');

    //
    // Check to see if we need to end the stream and create a new one
    //
    if (!this._needsNewFile()) { return; }

    //
    // End the current stream, ensure it flushes and create a new one.
    // TODO: This could probably be optimized to not run a stat call but its
    // the safest way since we are supporting `maxFiles`.
    // Remark: We could call `open` here but that would incur an extra unnecessary stat call
    //
    this._endStream(() => this._nextFile());
  }
};

File.prototype._setupStream = function (stream) {
  stream.on('error', this._onerror);
  stream.on('drain', this._ondrain);
  return stream;
};

File.prototype._cleanupStream = function (stream) {
  stream.removeListener('error', this._onerror);
  stream.removeListener('drain', this._ondrain);
  return stream;
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

  var file = path.join(this.dirname, this.filename),
      options = this.normalizeQuery(options),
      buff = '',
      results = [],
      row = 0;

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
    var data = (buff + data).split(/\n+/),
        l = data.length - 1,
        i = 0;

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
        && options.order != 'desc') {
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
  var file = path.join(this.dirname, this.filename),
      options = options || {},
      stream = new Stream;

  var tail = {
    file: file,
    start: options.start
  };

  stream.destroy = common.tailFile(tail, function (err, line) {

    if(err){
      return stream.emit('error',err);
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
  this.stat((err, size) => {
    if (err) return this.emit('error', err);

    this._size = size;
    this._createStream();
    this.opening = false;
  });

  //
  // TODO: Figure out what this is for as this is probably wrong currently
  //
  this._archive = this.zippedArchive ? this._dest.path : null;
};

File.prototype._needsNewFile = function (size) {
  size = size || this._size;
  return this.maxsize && size >= this.maxsize;
}

//
// ### function stat
// Stat the file and assess information in order to create the proper stream
//
File.prototype.stat = function stat(callback) {
  var target = this._getFile();
  var fullpath = path.join(this.dirname, target);

  fs.stat(fullpath, (err, stat) => {
    if (err && err.code === 'ENOENT') {
      return callback(null, 0);
    }
    if (err) { return callback(err); }

    if (!stat || this._needsNewFile(stat.size)) {
      //
      // If `stats.size` is greater than the `maxsize` for
      // this instance then try again
      //
      return this._incFile(() => this.stat(callback));
    }
    //
    // Once we have figured out what the filename is, set it and return the
    // size
    //
    this.filename = target;
    callback(null, stat.size);
  });
};

File.prototype._nextFile = function nextFile() {
  return this._incFile(() => this.open());
};

//
// ### function close ()
// Closes the stream associated with this instance.
//
File.prototype.close = function (cb) {
  var self = this;

  if (!this._stream) return;

  this._stream.end(() => {
    if (cb) cb();
    this.emit('flush');
    this.emit('closed');
  });
};

//
// ### @private function endStream
// #### @param {function} callback
// Unpipe from the stream that has been marked as FULL
// and end it so it flushes to disk
//
File.prototype._endStream = function endStream(callback) {
  this._stream.unpipe(this._dest);

  this._dest.end(() => {
    this._cleanupStream(this._dest);
    callback();
  });
};

//
// ### @private function _createStream ()
//
File.prototype._createStream = function () {
  var fullpath = path.join(this.dirname, this.filename);

  this._dest = this._stream.pipe(this._setupStream(fs.createWriteStream(fullname, self.options)));
  //
  // Figure out more about this
  //
  this._compressFile();
};

//
// TODO: Figure out how this really works
//
File.prototype._compressFile = function compressFile() {
  if (!this._archive) { return; }
  var gzip = zlib.createGzip();

  var inp = fs.createReadStream(String(this._archive));
  var out = fs.createWriteStream(this._archive + '.gz');

  inp.pipe(gzip).pipe(out);

  fs.unlink(String(this._archive), function () {});
  self._archive = '';
};
File.prototype._incFile = function (callback) {
  var ext = path.extname(this._basename),
      basename = path.basename(this._basename, ext),
      oldest,
      target;

  if (!this.tailable) {
    this._created += 1;
    this._checkMaxFilesIncrementing(ext, basename, callback);
  }
  else {
    this._checkMaxFilesTailable(ext, basename, callback);
  }
};

//
// ### @private function _getFile ()
// Gets the next filename to use for this instance
// in the case that log filesizes are being capped.
//
File.prototype._getFile = function () {
  var ext = path.extname(this._basename),
      basename = path.basename(this._basename, ext);

  //
  // Caveat emptor (indexzero): rotationFormat() was broken by design
  // when combined with max files because the set of files to unlink
  // is never stored.
  //
  return !this.tailable && this._created
    ? basename + (this.rotationFormat ? this.rotationFormat() : this._created) + ext
    : basename + ext;
};

//
// ### @private function _checkMaxFilesIncrementing ()
// Increment the number of files created or
// checked by this instance.
//
File.prototype._checkMaxFilesIncrementing = function (ext, basename, callback) {
  var oldest, target,
    self = this;

  if (self.zippedArchive) {
    self._archive = path.join(self.dirname, basename +
        ((self._created === 1) ? '' : self._created-1) +
        ext);
  }


  // Check for maxFiles option and delete file
  if (!self.maxFiles || self._created < self.maxFiles) {
    return callback();
  }

  oldest = self._created - self.maxFiles;
  target = path.join(self.dirname, basename + (oldest !== 0 ? oldest : '') + ext +
    (self.zippedArchive ? '.gz' : ''));
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
  var tasks = [],
      self = this;

  if (!this.maxFiles)
    return;

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

  if (self.zippedArchive) {
    self._archive = path.join(self.dirname, basename + 1 + ext);
  }
  async.series(tasks, function (err) {
    fs.rename(
      path.join(self.dirname, basename + ext),
      path.join(self.dirname, basename + 1 + ext),
      callback
    );
  });
};
