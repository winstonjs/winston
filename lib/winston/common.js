/*
 * common.js: Internal helper and utility functions for winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

const { format } = require('util');

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
      };
    }

    Object.defineProperty(obj, prop, {
      get: movedNotice,
      set: movedNotice
    });
  },
  forProperties: function (obj, type, props) {
    props.forEach(function (prop) {
      var notice = exports.warn[type](prop);
      Object.defineProperty(obj, prop, {
        get: notice,
        set: notice
      });
    });
  }
};
