/*
 * levels.js: Default settings for all levels that winston knows about 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

require.paths.unshift(__dirname);

var colors = require('colors');

var levels = exports;

//
// Export level sets
//
levels.npm    = require('levels/npm-levels').levels;
levels.syslog = require('levels/syslog-levels').levels;

var colorize = exports.colorize = function (level) {
  return level[exports.colors[level]];
};
