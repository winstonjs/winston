/*
 * transports.js: Set of all transports Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require('path');

//
// Setup all transports as lazy-loaded getters.
//
var transports = {
  Console: function() { return require('./transports/console.js').Console; },
  File: function() { return require('./transports/file.js').File; },
  Http: function() { return require('./transports/http.js').Http; },
  Memory: function() { return require('./transports/memory.js').Memory; }
}

Object.defineProperties(
  exports,
  Object.keys(transports)
    .reduce(function (acc, name) {
      acc[name] = {
        configurable: true,
        enumerable: true,
        get: transports[name]
      };

      return acc;
    }, {})
);
