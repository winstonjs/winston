/**
 * common.js: Internal helper and utility functions for winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const { format } = require('util');

/**
 * Set of simple deprecation notices and a way to expose them for a set of
 * properties.
 * @type {Object}
 * @private
 */
exports.warn = {
  deprecated(prop) {
    return () => {
      throw new Error(format('{ %s } was removed in winston@3.0.0.', prop));
    };
  },
  useFormat(prop) {
    return () => {
      throw new Error([
        format('{ %s } was removed in winston@3.0.0.', prop),
        'Use a custom winston.format = winston.format(function) instead.'
      ].join('\n'));
    };
  },
  forFunctions(obj, type, props) {
    props.forEach(prop => {
      obj[prop] = exports.warn[type](prop);
    });
  },
  forProperties(obj, type, props) {
    props.forEach(prop => {
      const notice = exports.warn[type](prop);
      Object.defineProperty(obj, prop, {
        get: notice,
        set: notice
      });
    });
  }
};


exports.dataUtils = {
  /**
   * Creates a deep copy of an object
   * @param {Object | string} data The data to clone
   * @returns {Object} A deep copy of the parameter object
   */
  cloneObject(data) {
    const isError = Object.prototype.toString.call(data) === '[object Error]';
    const isObject = typeof data === 'object';

    if (isError) {
      let nextErr = new Error(data.message);

      nextErr.stack = data.stack;
      Object.assign(nextErr, data);

      return nextErr;
    } else if (isObject) {
      return Object.assign({}, data);
    }

    // Assume the primitive case
    return data;
  }
};
