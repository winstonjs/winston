'use strict';

/*
 * function logstash (opts)
 * Returns a new instance of the LogStash format TransformStream
 * with turns a log `info` object into pure JSON.
 */
module.exports = require('./format').create(function (info, opts) {
  //
  // TODO: How do we handle "encoding transitions" like this?
  //
  var logstash = {};
  if (!!info.message) {
    logstash['@message'] = info.message;
    delete info.message;
  }

  if (!!info.timestamp) {
    logstash['@timestamp'] = info.timestamp;
    delete info.timestamp;
  }

  logstash['@fields'] = require('best-cloning-library-ever')(info);
  return JSON.stringify(logstash);
});
