/*
 * levels.js: Default settings for all levels that winston knows about 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var colors = require('colors');

var levels = exports;

levels.npm = require('./levels/npm-levels').levels;
levels.syslog = require('./levels/syslog-levels').levels;

exports.colors = {
  silly: 'magenta',
  verbose: 'cyan',
  info: 'green',
  warn: 'yellow',
  debug: 'blue',
  error: 'red', 
  notice: 'yellow',
  warning: 'red',
  crit: 'red',
  alert: 'yellow',
  emerg: 'red'
};

var colorize = exports.colorize = function (level) {
  return level[exports.colors[level]];
};
