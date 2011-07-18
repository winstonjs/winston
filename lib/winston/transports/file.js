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
    colors = require('colors'),
    log = require('../internal').log;
    
//
// ### function File (options)
// #### @options {Object} Options for this instance.
// Constructor function for the File transport object responsible
// for persisting log messages and metadata to one or more files.
//
var File = exports.File = function (options) {
  events.EventEmitter.call(this);
  options = options || {};
  
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
    this._basename = this.filename = path.basename(options.filename) || 'winston.log';
    this.dirname   = options.dirname || path.dirname(options.filename);
    this.options   = options.options || { flags: 'a' };    
  }
  else if (options.stream) {
    throwIf('stream', 'filename', 'maxsize');
    this.stream = options.stream;
  }
  else {
    throw new Error('Cannot log to file without filename or stream.');
  }
    
  this.level     = options.level     || 'info';
  this.silent    = options.silent    || false;
  this.colorize  = options.colorize  || false;
  this.timestamp = options.timestamp || true;
  this.maxsize   = options.maxsize   || null; 

  //
  // Internal state variables representing the number
  // of files this instance has created and the current
  // size (in bytes) of the current logfile.
  //
  this._size    = 0;
  this._created = 0;
  this._buffer  = [];
};

//
// Inherit from `events.EventEmitter`.
//
util.inherits(File, events.EventEmitter);

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

  var self = this, output = log(level, msg, meta, {
    colorize: this.colorize,
    timestamp: this.timestamp
  }) + '\n';
  
  this._size += output.length;
  
  if (!this.filename) {
    //
    // If there is no `filename` on this instance then it was configured
    // with a raw `WriteableStream` instance and we should not perform any
    // size restrictions.
    //
    this.stream.write(output);
  }
  else {
    this.open(function (err) {
      if (err) {
        //
        // If there was an error enqueue the message
        //
        return self._buffer.push(output);
      }
      
      self.stream.write(output);
    });
  }

  callback(null, true);
};

//
// ### function open (callback)
// #### @callback {function} Continuation to respond to when complete
// Checks to see if a new file needs to be created based on the `maxsize`
// (if any) and the current size of the file used.
//
File.prototype.open = function (callback) {
  var self = this;
  
  if (!this.stream || (this.maxsize && this._size >= this.maxsize)) {
    //
    // TODO: Buffer the log output before writing it 
    // to 
    //
    self._createStream();
    return callback(true);
  }
  
  callback();
};

//
// ### function flush ()
// Flushes any buffered messages to the current `stream`
// used by this instance.
//
File.prototype.flush = function () {
  var self = this;

  //
  // Iterate over the `_buffer` of enqueued messaged
  // and then write them to the newly created stream. 
  //
  this._buffer.forEach(function (str) {
    self.stream.write(str);
    self._size += str.length;
  });
  
  //
  // Quickly truncate the `_buffer` once the write operations
  // have been started
  //
  self._buffer.length = 0;
};

File.prototype._createStream = function () {
  var self = this;
    
  (function checkFile (target) {
    var fullname = path.join(self.dirname, target);
    
    //
    // Creates the `WriteStream` and then flushes any
    // buffered messages.
    //
    function createAndFlush (size) {
      self._size = size;
      self.filename = target;
      self.stream = fs.createWriteStream(fullname, self.options);

      //
      // Remark: It is possible that in the time it has taken to find the
      // next logfile to be written more data than `maxsize` has been buffered,
      // but for sensible limits (10s - 100s of MB) this seems unlikely in less
      // than one second.
      //
      self.flush();
    }
    
    fs.stat(fullname, function (err, stats) {
      if (err) {
        if (err.code !== 'ENOENT') {
          return self.emit('error', err);
        }
        
        return createAndFlush(0);
      }
      
      if (!stats || (self.maxsize && stats.size >= self.maxsize)) {
        //
        // If `stats.size` is greater than the `maxsize` for 
        // this instance then try again 
        //
        return checkFile(self._nextFile());
      }
      
      createAndFlush(stats.size);
    });
  })(this._basename);  
};

//
// ### @private function _nextFile ()
// Gets the next filename to use for this instance
// in the case that log filesizes are being capped.
//
File.prototype._nextFile = function () {
  var self = this,
      ext = path.extname(this._basename),
      basename = path.basename(this._basename, ext);
  
  //
  // Increment the number of files created or 
  // checked by this instance.
  //
  this._created += 1;
  return basename + this._created + ext;
};