/*
 * index.js: Set of all formats Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require('path'),
    camelcase = require('camelcase');

/**
 * @api private
 * @property {Array} available
 * Set of all available format names exposed by winston.
 */
var available = [
  'cli', 'colorize', 'json', 'logstash', 'pad-levels',
  'pretty-print', 'simple', 'splat', 'uncolorize'
];

/**
 * @api public
 * @property {function} format
 * Both the construction method and set of exposed
 * formats.
 */
var format = module.exports = require('./format');

//
// Setup all transports as lazy-loaded getters.
//
Object.defineProperties(
  format,
  available.reduce(function (acc, name) {
    var key = camelcase(name);

    acc[key] = {
      configurable: true,
      enumerable: true,
      get: function () {
        var fullpath = path.join(__dirname, name.toLowerCase());
        return require(fullpath);
      }
    };

    return acc;
  }, {})
);
