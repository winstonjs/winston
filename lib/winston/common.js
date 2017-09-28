/*
 * common.js: Internal helper and utility functions for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    crypto = require('crypto'),
    fs = require('fs'),
    StringDecoder = require('string_decoder').StringDecoder,
    Stream = require('stream').Stream,
    config = require('./config');

/**
 * @property {RegExp} formatRegExp
 * Captures the number of format (i.e. %s strings) in a given string.
 * Based on `util.format`, see Node.js source:
 * https://github.com/nodejs/node/blob/b1c8f15c5f169e021f7c46eb7b219de95fe97603/lib/util.js#L201-L230
 */
exports.formatRegExp = /%[sdjifoO%]/g;

/**
 * @property {RegExp} escapedPercent
 * Captures the number of escaped % signs in a format string (i.e. %s strings).
 */
exports.escapedPercent = /%%/g;

//
// ### function tailFile (options, iter)
// #### @options {Object} Options for tail.
// #### @iter {function} Iterator function to execute on every line.
// `tail -f` a file. Options must include file.
//
exports.tailFile = function(options, iter) {
  var buffer = new Buffer(64 * 1024),
      decode = new StringDecoder('utf8'),
      stream = new Stream,
      buff = '',
      pos = 0,
      row = 0;

  if (options.start === -1) {
    delete options.start;
  }

  stream.readable = true;
  stream.destroy = function() {
    stream.destroyed = true;
    stream.emit('end');
    stream.emit('close');
  };

  fs.open(options.file, 'a+', '0644', function (err, fd) {
    if (err) {
      if (!iter) {
        stream.emit('error', err);
      } else {
        iter(err);
      }
      stream.destroy();
      return;
    }

    (function read() {
      if (stream.destroyed) {
        fs.close(fd);
        return;
      }

      return fs.read(fd, buffer, 0, buffer.length, pos, function (err, bytes) {
        if (err) {
          if (!iter) {
            stream.emit('error', err);
          } else {
            iter(err);
          }
          stream.destroy();
          return;
        }

        if (!bytes) {
          if (buff) {
            if (options.start == null || row > options.start) {
              if (!iter) {
                stream.emit('line', buff);
              } else {
                iter(null, buff);
              }
            }
            row++;
            buff = '';
          }
          return setTimeout(read, 1000);
        }

        var data = decode.write(buffer.slice(0, bytes));
        if (!iter) {
          stream.emit('data', data);
        }

        data = (buff + data).split(/\n+/);

        var l = data.length - 1,
            i = 0;

        for (; i < l; i++) {
          if (options.start == null || row > options.start) {
            if (!iter) {
              stream.emit('line', data[i]);
            } else {
              iter(null, data[i]);
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

  if (!iter) {
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
    };
  },
  forFunctions: function (obj, type, props) {
    props.forEach(function (prop) {
      obj[prop] = exports.warn[type](prop);
    });
  },
  moved: function (obj, movedTo, prop) {
    function movedNotice() {
      return function () {
        throw new Error([
          format('winston.%s was moved in winston@3.0.0.', prop),
          format('Use a winston.%s instead.', movedTo)
        ].join('\n'));
      }
    };

    Object.defineProperty(obj, prop, {
      get: movedNotice,
      set: movedNotice
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
