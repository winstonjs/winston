/*
 * config.js: Default settings for all levels that winston knows about 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

require.paths.unshift(__dirname);

var colors = require('colors');

var config = exports;

//
// Export config sets
//
config.npm    = require('config/npm-config');
config.syslog = require('config/syslog-config');

var colorize = exports.colorize = function (level) {
  return level[exports.colors[level]];
};
