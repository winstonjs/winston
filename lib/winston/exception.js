/*
 * exception.js: Utility methods for gathing information about uncaughtExceptions.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */
 
var os = require('os'),
    stackTrace = require('stack-trace');
    
var exception = exports;

exception.getAllInfo = function () {
  
};

exception.getProcessInfo = function () {
  return {
    'process.pid':         process.pid,
    'process.uid':         process.getuid(),
    'process.gid':         process.getgid(),
    'process.cwd':         process.cwd(),
    'process.execPath':    process.execPath,
    'process.version':     process.version,
    'process.argv':        process.argv,
    'process.memoryUsage': process.memoryUsage(),
    'os.loadavg':          os.loadavg(),
    'os.uptime':           os.uptime()
  };
};