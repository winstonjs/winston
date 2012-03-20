/*
 * syslog-config.js: Config that conform to syslog logging levels. 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
var syslogConfig = exports;

syslogConfig.levels = {
  debug: 7, 
  info: 6, 
  notice: 5, 
  warning: 4,
  error: 3, 
  crit: 2,
  alert: 1,
  emerg: 0
};

syslogConfig.colors = {
  debug: 'blue',
  info: 'green',
  notice: 'yellow',
  warning: 'red',
  error: 'red', 
  crit: 'red',
  alert: 'yellow',
  emerg: 'red'
};
