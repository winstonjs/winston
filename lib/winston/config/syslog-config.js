/*
 * syslog-config.js: Config that conform to syslog logging levels.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var syslogConfig = exports;

syslogConfig.levels = {
  emerg: 7,
  alert: 6,
  crit: 5,
  error: 4,
  warning: 3,
  notice: 2,
  info: 1,
  debug: 0,
};

syslogConfig.colors = {
  emerg: 'red',
  alert: 'yellow',
  crit: 'red',
  error: 'red',
  warning: 'red',
  notice: 'yellow',
  info: 'green',
  debug: 'blue',
};
