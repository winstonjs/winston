/*
 * exception.js: Utility methods for gathing information about uncaughtExceptions.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var os = require('os'),
    prettyMs = require('pretty-ms'),
    stackTrace = require('stack-trace'),
    prettyBytes = require('pretty-bytes');

var exception = exports;

exception.getAllInfo = function (err) {
  return {
    date:    new Date().toString(),
    process: exception.getProcessInfo(),
    os:      exception.getOsInfo(),
    mem:     exception.getMemInfo(),
    trace:   exception.getTrace(err),
    stack:   err.stack && err.stack.split('\n')
  };
};

exception.getProcessInfo = function () {
  return {
    uptime:      prettyMs(os.uptime() * 1000),
    pid:         process.pid,
    uid:         process.getuid ? process.getuid() : null,
    gid:         process.getgid ? process.getgid() : null,
    cwd:         process.cwd(),
    execPath:    process.execPath,
    version:     process.version,
    argv:        process.argv
  };
};

exception.getOsInfo = function () {
  var loadavg = os.loadavg();
  return {
    cpus: os.cpus().length,
    loadavg: {
      1: loadavg[0],
      5: loadavg[1],
      15: loadavg[2]
    }
  };
}

exception.getMemInfo = function () {
  var memUsage = process.memoryUsage()
  Object.keys(memUsage).forEach(function (mem) {
    memUsage[mem] = prettyBytes(memUsage[mem])
  })

  return {
    free: prettyBytes(os.freemem()),
    total: prettyBytes(os.totalmem()),
    usage: memUsage
  };
}

exception.getTrace = function (err) {
  var trace = err ? stackTrace.parse(err) : stackTrace.get();
  return trace.map(function (site) {
    return {
      column:   site.getColumnNumber(),
      file:     site.getFileName(),
      function: site.getFunctionName(),
      line:     site.getLineNumber(),
      method:   site.getMethodName(),
      native:   site.isNative()
    }
  });
};
