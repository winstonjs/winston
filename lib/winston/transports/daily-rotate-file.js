/*
 * daily-rotate-file.js: Transport for outputting to a local log file
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
    common = require('../common'),
    Transport = require('./transport').Transport,
    Stream = require('stream').Stream;

//
// ### function DailyRotateFile (options)
// #### @options {Object} Options for this instance.
// Constructor function for the DailyRotateFile transport object responsible
// for persisting log messages and metadata to one or more files.
//
var DailyRotateFile = exports.DailyRotateFile = function (options) {
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

    this.dirname   = options.dirname || path.dirname(options.filename);
    this.options   = options.options || { flags: 'a' };

    //
    // "24 bytes" is maybe a good value for logging lines.
    //
    this.options.highWaterMark = this.options.highWaterMark || 24;
  }
  else if (options.stream) {
    throwIf('stream', 'filename', 'maxsize');
    this._stream = options.stream;

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
  this.colorize    = options.colorize    || false;
  this.maxsize     = options.maxsize     || null;
  this.maxFiles    = options.maxFiles    || null;
  this.maxDays     = options.maxDays     || null;
  this.prettyPrint = options.prettyPrint || false;
  this.timestamp   = options.timestamp != null ? options.timestamp : true;
  this.datePattern = options.datePattern != null ? options.datePattern : '.yyyy-MM-dd';
  
  if (this.json) {
    this.stringify = options.stringify;
  }
  
  this._filesDataStructure = new FilesDataHandler(this.dirname, this._basename, this.datePattern, this.maxFiles, this.maxDays);
  
  //
  // Internal state variables representing the number
  // of files this instance has created and the current
  // size (in bytes) of the current logfile.
  //
  this._size     = 0;
  this._created  = 0;
  this._buffer   = [];
  this._draining = false;

  var now = new Date();
  this._year   = now.getFullYear();
  this._month  = now.getMonth();
  this._date   = now.getDate();
  this._hour   = now.getHours();
  this._minute = now.getMinutes();

  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhM])\1?/g,
      pad = function (val, len) {
              val = String(val);
              len = len || 2;
              while (val.length < len) val = "0" + val;
              return val;
      };

  this.getFormattedDate = function() {
    var flags = {
      yy:   String(this._year).slice(2),
      yyyy: this._year,
      M:    this._month + 1,
      MM:   pad(this._month + 1),
      d:    this._date,
      dd:   pad(this._date)
      /*H:    this._hour,
      HH:   pad(this._hour),
      m:    this._minute,
      mm:   pad(this._minute)*/
    };
    return this.datePattern.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
};

//
// Inherit from `winston.Transport`.
//
util.inherits(DailyRotateFile, Transport);

//
// Expose the name of this Transport on the prototype
//
DailyRotateFile.prototype.name = 'dailyRotateFile';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
DailyRotateFile.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var self = this;

  var output = common.log({
    level:       level,
    message:     msg,
    meta:        meta,
    json:        this.json,
    colorize:    this.colorize,
    prettyPrint: this.prettyPrint,
    timestamp:   this.timestamp,
    stringify:   this.stringify
  }) + '\n';

  this._size += output.length;

  if (!this.filename) {
    //
    // If there is no `filename` on this instance then it was configured
    // with a raw `WriteableStream` instance and we should not perform any
    // size restrictions.
    //
    this._write(output, callback);
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
DailyRotateFile.prototype._write = function(data, callback) {
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
  callback(null, true);
};

//
// ### function query (options, callback)
// #### @options {Object} Loggly-like query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport. Options object is optional.
//
DailyRotateFile.prototype.query = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  // TODO when maxfilesize rotate occurs
  var file = path.join(this.dirname, this._basename + this.getFormattedDate()),
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
    if (options.rows && results.length >= options.rows) {
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
// ### function _tail (options, callback)
// #### @options {Object} Options for tail.
// #### @callback {function} Callback to execute on every line.
// `tail -f` a file. Options must include file.
//
DailyRotateFile.prototype._tail = function tail(options, callback) {
  var stream = fs.createReadStream(options.file, { encoding: 'utf8' }),
      buff = '',
      destroy,
      row = 0;

  destroy = stream.destroy.bind(stream);
  stream.destroy = function () {};

  if (options.start === -1) {
    delete options.start;
  }

  if (options.start == null) {
    stream.once('end', bind);
  } else {
    bind();
  }

  function bind() {
    stream.on('data', function (data) {
      var data = (buff + data).split(/\n+/),
          l = data.length - 1,
          i = 0;

      for (; i < l; i++) {
        if (options.start == null || row > options.start) {
          stream.emit('line', data[i]);
        }
        row++;
      }

      buff = data[l];
    });

    stream.on('line', function (data) {
      if (callback) callback(data);
    });

    stream.on('error', function (err) {
      destroy();
    });

    stream.on('end', function () {
      if (buff) {
        stream.emit('line', buff);
        buff = '';
      }

      resume();
    });

    resume();
  }

  function resume() {
    setTimeout(function () {
      stream.resume();
    }, 1000);
  }

  return destroy;
};

//
// ### function stream (options)
// #### @options {Object} Stream options for this instance.
// Returns a log stream for this transport. Options object is optional.
//
DailyRotateFile.prototype.stream = function (options) {
  var file = path.join(this.dirname, this._basename + this.getFormattedDate()),
      options = options || {},
      stream = new Stream;

  var tail = {
    file: file,
    start: options.start
  };

  stream.destroy = this._tail(tail, function (line) {
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
DailyRotateFile.prototype.open = function (callback) {
  var now = new Date();
  if (this.opening) {
    //
    // If we are already attempting to open the next
    // available file then respond with a value indicating
    // that the message should be buffered.
    //
    return callback(true);
  }
  else if (!this._stream || (this.maxsize && this._size >= this.maxsize) ||
      (this._year < now.getFullYear() || this._month < now.getMonth() || this._date < now.getDate())) {// || this._hour < now.getHours() || this._minute < now.getMinutes())) {
    //
    // If we dont have a stream or have exceeded our size, then create
    // the next stream and respond with a value indicating that
    // the message should be buffered.
    //
    callback(true);
    return this._createStream();
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
DailyRotateFile.prototype.close = function () {
  var self = this;

  if (this._stream) {
    this._stream.end();
    this._stream.destroySoon();

    this._stream.once('drain', function () {
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
DailyRotateFile.prototype.flush = function () {
  var self = this;

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
// ### @private function _createStream ()
// Attempts to open the next appropriate file for this instance
// based on the common state (such as `maxsize` and `_basename`).
//
DailyRotateFile.prototype._createStream = function () {
  var self = this;
  this.opening = true;

  (function checkFile (target) {
    var fullname = path.join(self.dirname, target);

    //
    // Creates the `WriteStream` and then flushes any
    // buffered messages.
    //
    function createAndFlush (size) {
      if (self._stream) {
        self._stream.end();
        self._stream.destroySoon();
      }

      self._size = size;
      self.filename = target;
      self._stream = fs.createWriteStream(fullname, self.options);

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
      
      // signaling the new file creation
      self._filesDataStructure.addFilename(target);
    }

    fs.stat(fullname, function (err, stats) {
      if (err) {
        if (err.code !== 'ENOENT') {
          return self.emit('error', err);
        }

        return createAndFlush(0);
      }
      
      // rotation remaining in the same day
      if (!stats || (self.maxsize && stats.size >= self.maxsize)) {
        //
        // If `stats.size` is greater than the `maxsize` for
        // this instance then try again
        //
        return checkFile(self._getFile());
      }
      
      // day-based rotation: check if the day has changed
      var now = new Date();
      if (self._year < now.getFullYear() || self._month < now.getMonth() || self._date < now.getDate()) {
        self._year   = now.getFullYear();
        self._month  = now.getMonth();
        self._date   = now.getDate();
        self._hour   = now.getHours();
        self._minute = now.getMinutes();
        self._created  = 0;
        return checkFile(self._getFile());
      }

      createAndFlush(stats.size);
    });
  })(this._filesDataStructure.getCurrentFile()); // rotating on day-base at startup
};

//
// ### @private function _getFile ()
// Gets the next filename to use for this instance (day-based rotation and
// rotation of days).
//
DailyRotateFile.prototype._getFile = function (/*boolean*/incrementDayFiles, /*boolean*/rotateDay) {
  return this._filesDataStructure.getNextFilenameToUse();
};

//
// ### @private function _lazyDrain ()
// Lazily attempts to emit the `logged` event when `this.stream` has
// drained. This is really just a simple mutex that only works because
// Node.js is single-threaded.
//
DailyRotateFile.prototype._lazyDrain = function () {
  var self = this;

  if (!this._draining && this._stream) {
    this._draining = true;

    this._stream.once('drain', function () {
      this._draining = false;
      self.emit('logged');
    });
  }
};














//
//Handler object for log files data structure: reads and parses log file names
//in logs directory at startup, exposes the next filename to use and rotates
//logs.
//
//* logsDir: directory in which to find logs, e.g. "./logs" or "logs"
//* filename: base filename of single log file, like "app-logs.log"
//* datePattern: daily transport date pattern, like ".yyyy-MM-dd"
//* maxFilesPerDay: in-day rotation limit
//* maxDays: daily rotation limit
//
//* (C) 2013 Nicola Baisero
//* MIT LICENCE
//
function FilesDataHandler(/*string*/logsDir, filename, datePattern, maxFilesPerDay, maxDays) {
  this._dataStructure = [];
  this._filename = filename; // with extension
  this._datePattern = datePattern; // with letters, like y, M, m
  this._logsDir = logsDir;
  this._maxPerDay = maxFilesPerDay;
  this._maxDays = maxDays;
  
  this._log('params: ' + util.inspect(arguments, {depth : 4}));
  
  // initializing data structure
  this._initDataStructure(logsDir);
  
  this._log('data structure');
  this._log(util.inspect(this._dataStructure, {depth: 5}));
}
(function() {
FilesDataHandler.prototype = {
  constructor : FilesDataHandler,
  
  //*** init stuff
  // Reads the logs directory and setups the data structure accordingly
  _initDataStructure : function(/*string*/logsDir) {
    var allFiles = fs.readdirSync(logsDir);
    
    for (var i = 0; i < allFiles.length; i++) {
      var curr = allFiles[i];
      
      if (curr.indexOf(this._filename) != -1) {
        // updating data structure
        this._insertInDataStructure(curr);
      }
    }
    
    // sorting data structure
    this._sortDays();
    this._sortIndexesInDays();
  },
  
  
  //*** removing elements stuff (also from file system)
  // removes the oldest log file name for today (in-day rotation)
  removeOldestFilenameLastDay : function() {
    if (!this._dataStructure.length) return;
    
    // getting file to delete
    var newestDay = this._dataStructure[this._dataStructure.length - 1];
    var files = newestDay.files;
    var fileToDelete = files.shift();
    
    // deleting file
    this._deleteFileSilent(fileToDelete.filename);
    
    // if that was the latest filename, removing entire day from data structure
    if (!files.length) this._dataStructure.pop();
  },
  // removes the oldest day (days rotation)
  removeOldestDay : function() {
    if (!this._dataStructure.length) return;
    
    // getting first day from data structure
    var latestElement = this._dataStructure.shift();
    var files = latestElement.files;
    
    // cycling over files for deletion
    for (var i = 0; i < files.length; i++) {
      this._deleteFileSilent(files[i].filename);
    }
    
    this._log('struct after deletion: ');
    this._log(util.inspect(this._dataStructure, {depth: 5}));
  },
  // adds the given filename to the data structure and rotates if necessary
  addFilename : function(filename) {
    this._log('adding filename: ' + filename);
    
    if (this._alreadyInserted(filename)) return;
    
    this._insertInDataStructure(filename);
    
    this._log('data struct after adding filename: ' + util.inspect(this._dataStructure, {depth: 5}));
    
    // rotating
    this._inDayRotateSafe();
    this._dailyRotateSafe();
    
    this._log('data struct after adding filename, after rotation: ' + util.inspect(this._dataStructure, {depth: 5}));
  },
  // assesses the next filename to use: doesn't check for file size, simply
  // creates the next name. If the related file gets created successfully,
  // addFilename must be then called for updating everything and for rotating.
  getNextFilenameToUse : function() {
    var now = new Date();
    
    // if there are logs for today, they are in the last position
    var lastDay = this._dataStructure[this._dataStructure.length - 1];
    
    // the day exists, and also a log file
    if (!lastDay || this._datesEqualYearMonthDay(lastDay.date, now)) {
      var latestLogFileInDay = lastDay.files[lastDay.files.length - 1];
      
      this._log('*********** nuovo file: ' + this._filename + this._formatDate(now) + "." + (latestLogFileInDay.index + 1));
      
      return this._filename + this._formatDate(now) + "." + (latestLogFileInDay.index + 1);
    }
    // the day doesn't exist
    else {
      this._log('*********** nuovo file n: ' + this._filename + this._formatDate(now));
      
      return this._filename + this._formatDate(now);
    }
  },
  // returns the latest log file of the day if that day exists, otherwise
  // returns a new name file, for today. This filename doesn't get added
  // to the structure: the addition occurs with "addFilename"
  getCurrentFile : function() {
    var now = new Date();
    
    var lastDay = this._dataStructure[this._dataStructure.length - 1];
    
    if (lastDay && this._datesEqualYearMonthDay(lastDay.date, now)) {
      var lastDayFiles = lastDay.files;
      
      return lastDayFiles[lastDayFiles.length - 1].filename;
    } else {
      return this._filename + this._formatDate(now);
    }
  },
  
  
  
  
  //******  internal business
  //*** filenames parsing
  // retrieve given filename's index, defaulting to 0
  _getFileIndex : function(filename) {
    var regEx = new RegExp('^.*' + this._getDatePatternRegex() + '\.(.*)$');
    var matchResult = filename.match(regEx);
    var rawIndex = (matchResult && matchResult[1] ? matchResult[1] : null);
    var index = parseInt(rawIndex); // it's null safe
    
    return (isNaN(index) ? 0 : index);
  },
  // retrieve and parse given filename's date
  /*returns Date*/ _getFileDate : function(filename) {
    var datePatternRegex = this._getDatePatternRegex();
    var dateRegex = new RegExp('^' + this._filename + '(' + datePatternRegex + ')');
    var matchResult = filename.match(dateRegex);
    var rawDate = matchResult[1]; // like .2017-05-12
    
    // getting string values
    var year = '';
    var month = '';
    var day = '';
    var yearDigits = 0;
    for (var i = 0; i < this._datePattern.length; i++) {
      var curr = this._datePattern[i];
      var stringDateVal = rawDate[i];
      
      if (curr == 'y') {
        yearDigits++;
        year += stringDateVal;
      } else if (curr == 'M') {
        month += stringDateVal;
      } else if (curr == 'd') {
        day += stringDateVal;
      }
    }
    month -= 1; // they start from 0...
    
    return new Date(year, month, day);
  },
  // transforms date pattern from 
  _getDatePatternRegex : function() {
    return this._datePattern.replace(/[yMdHm]/g, '\\d');
  },
  
  
  //*** Data structure handling
  _insertInDataStructure : function(filename, /*boolean*/checkAlreadyInserted) {
    // parsing filename's stuff
    var index = this._getFileIndex(filename);
    var date = this._getFileDate(filename);
    
    this._log('***********');
    this._log('filename: ' + filename);
    this._log('index: ' + index);
    this._log('date: ' + date);
    this._log('***********');
    
    // get the insertion index
    var insertionIndex = -1;
    var newInsert = true;
    for (var i = 0; i < this._dataStructure.length; i++) {
      var currEl = this._dataStructure[i];
      
      // date found, inserting index
      if (this._datesEqualYearMonthDay(currEl.date, date)) {
        insertionIndex = i;
        newInsert = false;
        break;
      }
      // need to seek ahead
      if (currEl.date < date) continue;
      // previous index was the right one
      if (currEl.date > date) {
        insertionIndex = i - 1;
        break;
      }
    }
    
    // inserting element in the given index
    // last
    if (insertionIndex < 0) {
      this._dataStructure.push(this._getNewElement(date, index, filename));
    }
    // inserting element at given index, it's brand new
    else if (newInsert) {
      this._dataStructure.splice(insertionIndex, 0, this._getNewElement(date, index, filename));
    }
    // updating element at given index
    else {
      this._updateElementForIndex(insertionIndex, index, filename);
    }
  },
  _updateElementForIndex : function(arrayIndex, dayCounter, filename) {
    var dayFiles = this._dataStructure[arrayIndex].files; // as returned by _getNewElement
    
    // finding position in which to insert the filename
    var insertionIndex = -1;
    for (var i = 0; i < dayFiles.length; i++) {
      var currentElement = dayFiles[i];
      
      if (currentElement.index < dayCounter) continue;
      if (currentElement.index > dayCounter) {
        insertionIndex = i - 1;
      }
    }
    
    // inserting filename
    // last
    if (insertionIndex < 0) {
      dayFiles.push(this._getNewFileElement(dayCounter, filename));
    } else {
      dayFiles.splice(insertionIndex, 0, this._getNewFileElement(dayCounter, filename));
    }
  },
  _getNewElement : function(date, index, filename) {
    return {
      date : date,
      files : [this._getNewFileElement(index, filename)]
    };
  },
  _getNewFileElement : function(index, filename) {
    return {
      index : index,
      filename : filename
    };
  },
  // says if the given filename has been already inserted in the structure
  _alreadyInserted : function(filename) {
    for (var i = 0; i < this._dataStructure.length; i++) {
      var currEl = this._dataStructure[i];
      for (var j = 0; j < currEl.files.length; j++) {
        if (currEl.files[j].filename == filename) return true;
      }
    }
    
    return false;
  },
  // sorting functions, useful only on startup
  _sortDays : function() {
    this._dataStructure.sort(function(a, b) {
      return a.date - b.date;
    });
  },
  _sortIndexesInDays : function() {
    for (var i = 0; i < this._dataStructure.length; i++) {
      this._dataStructure[i].files.sort(function(a, b) {
        return a.index - b.index;
      });
    }
  },
  
  //*** rotation
  // checks if day rotation is needed and eventually performs it
  _dailyRotateSafe : function() {
    // checks
    if (this._dataStructure.length <= this._maxDays) return;
    
    // rotating
    while (this._dataStructure.length > this._maxDays) this.removeOldestDay();
  },
  // checks if in-day rotation is needed and eventually performs it
  _inDayRotateSafe : function() {
    var lastDay = this._dataStructure[this._dataStructure.length - 1];
    
    if (lastDay.files.length > this._maxPerDay) this.removeOldestFilenameLastDay();
  },
  
  
  //*** misc
  // useful for turning off logging when necessary
  _log : function(message) {
    //console.log(message);
  },
  _datesEqualYearMonthDay : function(dateA, dateB) {
    return dateA.getFullYear() == dateB.getFullYear() &&
      dateA.getMonth() == dateB.getMonth() &&
      dateA.getDate() == dateB.getDate();
  },
  _deleteFileSilent : function(filename) {
    this._log('deleting log ' + filename);
    
    var filePath = path.resolve('.', path.join(this._logsDir, filename));
    
    try {
      fs.unlinkSync(filePath);
    } catch(error) {
      console.log('Error while deleting file ' + filePath + ': ' + util.inspect(error, {depth : 4}));
    }
  },
  // XXX copied from above...
  _formatDate : function(dateInstance) {
    var year = dateInstance.getFullYear();
    var month = dateInstance.getMonth();
    var date = dateInstance.getDate();
    
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhM])\1?/g,
      pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) val = "0" + val;
        return val;
      };
      
    var flags = {
      yy:   String(year).slice(2),
      yyyy: year,
      M:    month + 1,
      MM:   pad(month + 1),
      d:    date,
      dd:   pad(date)
      };
      return this._datePattern.replace(token, function ($0) {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
      });
  }
};
})();