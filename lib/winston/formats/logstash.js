'use strict';

var format = require('./format');

/*
 * function logstash (opts)
 * Returns a new instance of the LogStash format TransformStream
 * with turns a log `info` object into pure JSON.
 */
module.exports = format(function (info, opts) {
  var logstash = {};
  if (!!info.message) {
    logstash['@message'] = info.message;
    delete info.message;
  }

  if (!!info.timestamp) {
    logstash['@timestamp'] = info.timestamp;
    delete info.timestamp;
  }

  logstash['@fields'] = info;
  info.raw = JSON.stringify(logstash);
  return info;
});
