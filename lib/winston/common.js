/*
 * common.js: Internal helper and utility functions for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    crypto = require('crypto'),
    cycle = require('cycle'),
    fs = require('fs'),
    StringDecoder = require('string_decoder').StringDecoder,
    Stream = require('stream').Stream,
    config = require('./config');

//
// ### function setLevels (target, past, current)
// #### @target {Object} Object on which to set levels.
// #### @past {Object} Previous levels set on target.
// #### @current {Object} Current levels to set on target.
// Create functions on the target objects for each level
// in current.levels. If past is defined, remove functions
// for each of those levels.
//
exports.setLevels = function (target, past, current) {
  var self = this;
  if (past) {
    Object.keys(past).forEach(function (level) {
      delete target[level];
    });
  }

  target.levels = current || config.npm.levels;
  Object.defineProperty(target.levels, 'len', {
    enumerable: false,
    configurable: false,
    value: Math.max.apply(null, Object.keys(target.levels)
      .map(function (lev) { return lev.length; }))
  });

  //
  //  Define prototype methods for each log level
  //  e.g. target.log('info', msg) <=> target.info(msg)
  //
  Object.keys(target.levels).forEach(function (level) {
    if (level === 'log') {
      console.warn('Level "log" not defined: conflicts with the method "log". Use a different level name.');
      return;
    }

    target[level] = function (msg) {
      // build argument list (level, msg, ... [string interpolate], [{metadata}], [callback])
      var args = [level].concat(Array.prototype.slice.call(arguments));
      target.log.apply(target, args);
    };
  });

  return target;
};

//
// ### function timestamp ()
// Returns a timestamp string for the current time.
//
exports.timestamp = function () {
  return new Date().toISOString();
};

//
// ### function serialize (obj, key)
// #### @obj {Object|literal} Object to serialize
// #### @key {string} **Optional** Optional key represented by obj in a larger object
// Performs simple comma-separated, `key=value` serialization for Loggly when
// logging to non-JSON inputs.
//
exports.serialize = function (obj, key) {
  // symbols cannot be directly casted to strings
  if (typeof key === 'symbol') {
    key = key.toString()
  }
  if (typeof obj === 'symbol') {
    obj = obj.toString()
  }

  if (obj === null) {
    obj = 'null';
  }
  else if (obj === undefined) {
    obj = 'undefined';
  }
  else if (obj === false) {
    obj = 'false';
  }

  if (typeof obj !== 'object') {
    return key ? key + '=' + obj : obj;
  }

  if (obj instanceof Buffer) {
    return key ? key + '=' + obj.toString('base64') : obj.toString('base64');
  }

  var msg = '',
      keys = Object.keys(obj),
      length = keys.length;

  for (var i = 0; i < length; i++) {
    if (Array.isArray(obj[keys[i]])) {
      msg += keys[i] + '=[';

      for (var j = 0, l = obj[keys[i]].length; j < l; j++) {
        msg += exports.serialize(obj[keys[i]][j]);
        if (j < l - 1) {
          msg += ', ';
        }
      }

      msg += ']';
    }
    else if (obj[keys[i]] instanceof Date) {
      msg += keys[i] + '=' + obj[keys[i]];
    }
    else {
      msg += exports.serialize(obj[keys[i]], keys[i]);
    }

    if (i < length - 1) {
      msg += ', ';
    }
  }

  return msg;
};

//
// ### function tailFile (options, callback)
// #### @options {Object} Options for tail.
// #### @callback {function} Callback to execute on every line.
// `tail -f` a file. Options must include file.
//
exports.tailFile = function(options, callback) {
  var buffer = new Buffer(64 * 1024)
    , decode = new StringDecoder('utf8')
    , stream = new Stream
    , buff = ''
    , pos = 0
    , row = 0;

  if (options.start === -1) {
    delete options.start;
  }

  stream.readable = true;
  stream.destroy = function() {
    stream.destroyed = true;
    stream.emit('end');
    stream.emit('close');
  };

  fs.open(options.file, 'a+', '0644', function(err, fd) {
    if (err) {
      if (!callback) {
        stream.emit('error', err);
      } else {
        callback(err);
      }
      stream.destroy();
      return;
    }

    (function read() {
      if (stream.destroyed) {
        fs.close(fd);
        return;
      }

      return fs.read(fd, buffer, 0, buffer.length, pos, function(err, bytes) {
        if (err) {
          if (!callback) {
            stream.emit('error', err);
          } else {
            callback(err);
          }
          stream.destroy();
          return;
        }

        if (!bytes) {
          if (buff) {
            if (options.start == null || row > options.start) {
              if (!callback) {
                stream.emit('line', buff);
              } else {
                callback(null, buff);
              }
            }
            row++;
            buff = '';
          }
          return setTimeout(read, 1000);
        }

        var data = decode.write(buffer.slice(0, bytes));

        if (!callback) {
          stream.emit('data', data);
        }

        var data = (buff + data).split(/\n+/)
          , l = data.length - 1
          , i = 0;

        for (; i < l; i++) {
          if (options.start == null || row > options.start) {
            if (!callback) {
              stream.emit('line', data[i]);
            } else {
              callback(null, data[i]);
            }
          }
          row++;
        }

        buff = data[l];

        pos += bytes;

        return read();
      });
    })();
  });

  if (!callback) {
    return stream;
  }

  return stream.destroy;
};

/**
 * @property {Object} warn
 * Set of simple deprecation notices and a way
 * to expose them for a set of properties.
 *
 * @api private
 */
exports.warn = {
  deprecated: function warnDeprecated(prop) {
    return function () {
      throw new Error(format('{ %s } was removed in winston@3.0.0.', prop));
    };
  },
  useFormat: function warnFormat(prop) {
    return function () {
      throw new Error([
        format('{ %s } was removed in winston@3.0.0.', prop),
        'Use a custom winston.format = winston.format(function) instead.'
      ].join('\n'));
    }
  },
  forFunctions: function (obj, type, props) {
    props.forEach(function (prop) {
      obj[prop] = exports.warn[type](prop);
    });
  },
  forProperties: function (obj, type, props) {
    props.forEach(function (prop) {
      var notice = exports.warn[type](prop)
      Object.defineProperty(obj, prop, {
        get: notice,
        set: notice
      });
    });
  }
};
