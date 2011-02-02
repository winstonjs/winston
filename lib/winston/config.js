/*
 * config.js: Default settings for all levels that winston knows about 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

require.paths.unshift(__dirname);

var colors = require('colors'),
    config = exports, 
    allColors = {};

function mixin (target) {
  var args = Array.prototype.slice.call(arguments, 1);

  args.forEach(function (a) {
    var keys = Object.keys(a);
    for (var i = 0; i < keys.length; i++) {
      target[keys[i]] = a[keys[i]];
    }
  });
  return target;
};

config.add = function (name, settings) {
  mixin(allColors, settings.colors);
  Object.defineProperty(config, name, {
    get: function () {
      return settings;
    }
  })
};

config.colorize = function (level) {
  return level[allColors[level]];
};

//
// Export config sets
//
config.add('npm', require('config/npm-config'));
config.add('syslog', require('config/syslog-config'));