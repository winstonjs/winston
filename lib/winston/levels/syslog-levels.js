/*
 * npm-levels.js: Levels that conform to syslog logging levels. 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
var syslogLevels = exports;

syslogLevels.levels = {
  debug: 0, 
  info: 1, 
  notice: 2, 
  warning: 3,
  error: 4, 
  crit: 5,
  alert: 6,
  emerg: 7
};

syslogLevels.colors = {
  debug: 'blue',
  info: 'green',
  notice: 'yellow',
  warning: 'red',
  error: 'red', 
  crit: 'red',
  alert: 'yellow',
  emerg: 'red'
};