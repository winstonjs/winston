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
    Transport = require('./transport').Transport,
    isWritable = require('isstream').isWritable,
    Stream = require('stream').Stream,
    os = require('os');

//
// ### function File (options)
// #### @options {Object} Options for this instance.
// Constructor function for the File transport object responsible
// for persisting log messages and metadata to one or more files.
//
var File = exports.File = function (options) {
  var self = this;
  Transport.call(this, options);

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

  if (options.filename || options.dirname) {
    throwIf('filename or dirname', 'stream');
    this._basename = this.filename = options.filename
      ? path.basename(options.filename)
      : 'winston.log';

    this.dirname = options.dirname || path.dirname(options.filename);
    this.options = options.options || { flags: 'a' };

    //
    // "24 bytes" is maybe a good value for logging lines.
    //
    this.options.highWaterMark = this.options.highWaterMark || 24;
  }
  else if (options.stream) {
    throwIf('stream', 'filename', 'maxsize');
    this._stream = options.stream;
    this._isStreams2 = isWritable(this._stream);
    this._stream.on('error', function(error){
      self.emit('error', error);
    });
    //
    // We need to listen for drain events when
    // write() returns false. This can make node
    // mad at times.
    //
    this._stream.setMaxListeners(Infinity);
  }
  else {
    throw new Error('Cannot log to file without filename or stream.');
  }

  this.json        = options.json !== false;
  this.logstash    = options.logstash    || false;
  this.colorize    = options.colorize    || false;
  this.maxsize     = options.maxsize     || null;
  this.zippedArchive = options.zippedArchive || false;
  this.maxFiles    = options.maxFiles    || null;
  this.prettyPrint = options.prettyPrint || false;
  this.label       = options.label       || null;
  this.timestamp   = options.timestamp != null ? options.timestamp : true;
  this.eol         = options.eol || os.EOL;
  this.tailable    = options.tailable    || false;
  this.depth       = options.depth       || null;
  this.showLevel   = options.showLevel === undefined ? true : options.showLevel;
  this.maxRetries  = options.maxRetries || 2;

  if (this.json) {
    this.stringify = options.stringify;
  }

  //
  // Internal state variables representing the number
  // of files this instance has created and the current
  // size (in bytes) of the current logfile.
  //
  this._size     = 0;
  this._fileIndex = 0;
  this._buffer   = [];
  this._draining = false;
  this._opening  = false;
  this._failures = 0;
};

//
// Inherit from `winston.Transport`.
//
util.inherits(File, Transport);

//
// Expose the name of this Transport on the prototype
//
File.prototype.name = 'file';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
File.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  //
  // If failures exceeds maxRetries then we can't access the
  // stream. In this case we need to perform a noop and return
  // an error.
  //
  if (this._failures >= this.maxRetries) {
    return callback(new Error('Transport is in a failed state.'));
  }

  var self = this;

  if (typeof msg !== 'string') {
    msg = '' + msg;
  }

  var output = common.log({
    level:       level,
    message:     msg,
    meta:        meta,
    json:        this.json,
    logstash:    this.logstash,
    colorize:    this.colorize,
    prettyPrint: this.prettyPrint,
    timestamp:   this.timestamp,
    showLevel:   this.showLevel,
    stringify:   this.stringify,
    label:       this.label,
    depth:       this.depth,
    formatter:   this.formatter,
    humanReadableUnhandledException: this.humanReadableUnhandledException
  });

  if (typeof output === 'string') {
    output += this.eol;
  }

  if (!this.filename) {
    //
    // If there is no `filename` on this instance then it was configured
    // with a raw `WriteableStream` instance and we should not perform any
    // size restrictions.
    //
    this._write(output, callback);
    this._size += output.length;
    this._lazyDrain();
  }
  else {
    this.open(function (err) {
      if (err) {
        //
        // If there was an error enqueue the message
        //
        return self._buffer.push([output, callback]);
      }

      self._write(output, callback);
      self._size += output.length;
      self._lazyDrain();
    });
  }
};

//
// ### function _write (data, cb)
// #### @data {String|Buffer} Data to write to the instance's stream.
// #### @cb {function} Continuation to respond to when complete.
// Write to the stream, ensure execution of a callback on completion.
//
File.prototype._write = function(data, callback) {
  if (this._isStreams2) {
    this._stream.write(data);
    return callback && process.nextTick(function () {
      callback(null, true);
    });
  }

  // If this is a file write stream, we could use the builtin
  // callback functionality, however, the stream is not guaranteed
  // to be an fs.WriteStream.
  var ret = this._stream.write(data);
  if (!callback) return;
  if (ret === false) {
    return this._stream.once('drain', function() {
      callback(null, true);
    });
  }
  process.nextTick(function () {
    callback(null, true);
  });
};

//
// ### function query (options, callback)
// #### @options {Object} Loggly-like query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport. Options object is optional.
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
        || (options.until && time > options.until)) {
      return;
    }

    return true;
  }
};

//
// ### function stream (options)
// #### @options {Object} Stream options for this instance.
// Returns a log stream for this transport. Options object is optional.
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
// ### function open (callback)
// #### @callback {function} Continuation to respond to when complete
// Checks to see if a new file needs to be created based on the `maxsize`
// (if any) and the current size of the file used.
//
File.prototype.open = function (callback) {
  var self = this;

  if (this.opening) {
    //
    // If we are already attempting to open the next
    // available file or waiting for the current stream to finish
    // then respond with a value indicating
    // that the message should be buffered.
    //
    return callback(true);
  }
  else if (!this._stream) {
    //
    // If we dont have a stream, then create
    // the next stream and respond with a value indicating that
    // the message should be buffered.
    //
    callback(true);
    return this._createStream();
  }
  else if (this.maxsize && this._size >= this.maxsize) {
    //
    // If we have exceeded our size, then close the current stream
    // and create the next stream. If the next stream is the same
    // file, _createStream will wait for it to finish before creating
    // the next stream. Either way this function will respond with a value
    // indicating that the message should be buffered.
    //
    this._closeStream();
    this._createStream();
    callback(true);
    return;
  }

  //
  // Otherwise we have a valid (and ready) stream.
  //
  callback();
};

//
// ### function close ()
// Closes the stream associated with this instance.
//
File.prototype.close = function () {
  var self = this;

  if (this._stream) {
    this._stream.end();
    this._stream.destroySoon();

    this._stream.once('finish', function () {
      self.emit('flush');
      self.emit('closed');
    });
  }
};

//
// ### function flush ()
// Flushes any buffered messages to the current `stream`
// used by this instance.
//
File.prototype.flush = function () {
  var self = this;

  // If nothing to flush, there will be no "flush" event from native stream
  // Thus, the "open" event will never be fired (see _createStream.createAndFlush function)
  // That means, self.opening will never set to false and no logs will be written to disk
  if (!this._buffer.length) {
    return self.emit('flush');
  }

  //
  // Iterate over the `_buffer` of enqueued messaged
  // and then write them to the newly created stream.
  //
  this._buffer.forEach(function (item) {
    var str = item[0],
        callback = item[1];

    process.nextTick(function () {
      self._write(str, callback);
      self._size += str.length;
    });
  });

  //
  // Quickly truncate the `_buffer` once the write operations
  // have been started
  //
  self._buffer.length = 0;

  //
  // When the stream has drained we have flushed
  // our buffer.
  //
  self._stream.once('drain', function () {
    self.emit('flush');
    self.emit('logged');
  });
};

//
// ### @private function _closeStream ()
// Closes the current stream and compresses it if so configured.
//
File.prototype._closeStream = function () {
    var self = this;
    var ext = path.extname(this._basename),
        basename = path.basename(this._basename, ext);
    var fullname = path.join(self.dirname, self.filename);

    var streamToClose = self._stream;

    self._stream.once('finish', function () {
        async.series([
            function compress(callback) {
              if (self.zippedArchive) {
                var gzip = zlib.createGzip();

                var inp = fs.createReadStream(fullname);
                var out = fs.createWriteStream(fullname + '.gz');

                var stream = inp.pipe(gzip).pipe(out);
                stream.on('finish', function() {
                    fs.unlink(fullname, callback);
                });
              }
              else {
                  return callback();
              }
            },
            function rotate(callback) {
                if (!self.maxFiles) {
                    return callback();
                }

                if (self.tailable) {
                      var tasks = [];

                      for (var x = self.maxFiles - 1; x > 0; x--) {
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

                      async.series(tasks, function (err) {
                        fs.rename(
                          path.join(self.dirname, basename + ext + (self.zippedArchive ? '.gz' : '')),
                          path.join(self.dirname, basename + 1 + ext + (self.zippedArchive ? '.gz' : '')),
                          callback
                        );
                      });
                }
                else {
                    // this technically will count files that weren't written by this process
                    // towards the maximum, but that's sort of intuitive.
                    if (self._fileIndex < self.maxFiles) {
                        return callback();
                    }

                    var oldest = self._fileIndex - self.maxFiles;
                    var target = path.join(self.dirname, basename + (oldest !== 0 ? oldest : '') + ext +
                        (self.zippedArchive ? '.gz' : ''));
                    fs.unlink(target, callback);
                }
            },
        ], function(err) {
            streamToClose._defunct = true;
            self.emit('finish');
        });
    });
    self._stream.end();
};

//
// ### @private function _createStream ()
// Attempts to open the next appropriate file for this instance
// based on the common state (such as `maxsize` and `_basename`).
//
File.prototype._createStream = function () {
  var self = this;
  this.opening = true;
  var results;

  function createAndFlush(err, results) {
      var ext = path.extname(results.filename),
         basename = path.basename(results.filename, ext);
      var fullname = path.join(self.dirname, basename + ext);

      // before we can open the stream, we need to check:
      // 1) Are we still writing buffered data to the stream?
      // 2) If the file exists, can we append to it?

      // we are actually still writing to the file we want to open...
      if (self._stream && !self._stream._defunct && results.filename && results.filename == self.filename) {
        self.once('finish', self._createStream.bind(self));
      }
      else if (results.exists && !results.append) {
          // This should only happen under two conditions:
          // A) the mode is tailable (since in incrementing mode, 
          // we will keep looking until we find a file
          // that does not exist or has room to append to
          // The only way this should happen is if there is a file there
          // that exists without being put there by this application instance.
          //
          // and
          //
          // B) the file was already there when the process started and it
          // did not have room to append. This is because if this process 
          // created the file, when it filled up this process would have rolled
          // it out of the way.

          // TODO: why am I getting in here in the unit tests?
          var newname = path.join(self.dirname, basename + new Date().getTime() + '_WHYAREYOUHERE' + ext);
          fs.rename(fullname, newname, self._createStream.bind(self));
      }
      else {
          self._fileIndex = results._fileIndex;
          self._size = results.size;
          self.filename = results.filename;
          self._stream = fs.createWriteStream(fullname, self.options);
          self._isStreams2 = isWritable(self._stream);
          self._stream.on('error', function(error){
            if (self._failures < self.maxRetries) {
              self._createStream();
              self._failures++;
            }
            else {
              self.emit('error', error);
            }
          });
          //
          // We need to listen for drain events when
          // write() returns false. This can make node
          // mad at times.
          //
          self._stream.setMaxListeners(Infinity);

          //
          // When the current stream has finished flushing
          // then we can be sure we have finished opening
          // and thus can emit the `open` event.
          //
          self.once('flush', function () {
            // Because "flush" event is based on native stream "drain" event,
            // logs could be written inbetween "self.flush()" and here
            // Therefore, we need to flush again to make sure everything is flushed
            self.flush();

            self.opening = false;
            self.emit('open', fullname);
          });
          //
          // Remark: It is possible that in the time it has taken to find the
          // next logfile to be written more data than `maxsize` has been buffered,
          // but for sensible limits (10s - 100s of MB) this seems unlikely in less
          // than one second.
          //
          self.flush();
      }
  };

  if (this.tailable) {
    this._findFileTailable(createAndFlush);
  }
  else {
    this._findFileIncrementing(createAndFlush);
  }
};

File.prototype._findFileTailable = function(callback) {
    var ext = path.extname(this._basename),
        basename = path.basename(this._basename, ext);
    this._checkFile(basename + ext, function(err, results) {
        results._fileIndex = 0;
        return callback(err, results);
    });
};

File.prototype._findFileIncrementing = function(callback) {
    var self = this;
    var i = self._fileIndex;
    var results;
    var ext = path.extname(this._basename),
        basename = path.basename(this._basename, ext);

    async.whilst(
        function() {
            if (!results) return true; 

            if (self.zippedArchive) {
                // specifically skip over an index if the zip exists
                // because we'll overwrite it and it might contain something
                // the user cares about.
                return (results.exists && !results.append) || results.zipExists;
            }
            else {
                return (results.exists && !results.append);
            }
        },
        function(callback) {
            var filename = i ? basename + i + ext : basename + ext;
            i++;
            self._checkFile(filename, function(err, r) {
                results = r;
                return callback(err);
            });
        },
        function(err) {
            results._fileIndex = i;
            return callback(err, results);
        }
    );
};

File.prototype._checkFile = function (filename, callback) {
    var self = this;
    var results = {
        filename: filename,
        append: true,
        exists: false,
        size: 0,
        zipExists: false,
    };
    var fullname = path.join(self.dirname, filename);
    var zipfullname = fullname + '.gz';

    async.series([
        function fileDoesNotExistOrSmallEnough(callback) {
            fs.stat(fullname, function (err, stats) {
              if (err) {
                if (err.code !== 'ENOENT') {
                  return callback(err);
                }

                results.exists = false;
                results.append = false;
                return callback();
              }

              if (stats) {
                results.exists = true;
                results.size = stats.size;

                if (self.maxsize && stats.size >= self.maxsize) {
                    results.append = false;
                }

                return callback();
              }
              else {
                return callback();
              }
            });
        },
        function zipDoesNotExist(callback) {
            fs.stat(zipfullname, function (err, stats) {
              if (err) {
                if (err.code !== 'ENOENT') {
                  return callback(err);
                }

                return callback();
              }

              results.zipExists = true;
              return callback();
            });
        },
    ], function (err) {
        if (err) {
            return callback(err);
        }

        return callback(null, results);
    });
};

//
// ### @private function _lazyDrain ()
// Lazily attempts to emit the `logged` event when `this.stream` has
// drained. This is really just a simple mutex that only works because
// Node.js is single-threaded.
//
File.prototype._lazyDrain = function () {
  var self = this;

  if (!this._draining && this._stream) {
    this._draining = true;

    this._stream.once('drain', function () {
      this._draining = false;
      self.emit('logged');
    });
  }
};
