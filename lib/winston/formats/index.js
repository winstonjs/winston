/*
 * index.js: Set of all formats Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require('path');

//
// Setup all transports as lazy-loaded getters.
//
Object.defineProperties(
  exports,
  ['colorize', 'default', 'json', 'logstash', 'pretty-print', 'uncolorize']
    .reduce(function (acc, name) {
      var key = name === 'pretty-print'
        ? 'prettyPrint'
        : name;

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
