/*
 * npm-levels.js: Levels that conform to npm logging levels. 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
var npmLevels = exports;

npmLevels.levels = {
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