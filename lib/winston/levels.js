/*
 * levels.js: Default settings for all levels that winston knows about 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var colors = require('colors');

exports.levels = {
  silly: 0, 
  verbose: 1, 
  info: 2, 
  warn: 3,
  debug: 4, 
  error: 5
};

exports.colors = {
  silly: 'magenta',
  verbose: 'cyan',
  info: 'green',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
};

var colorize = exports.colorize = function (level) {
  return level[exports.colors[level]];
};
