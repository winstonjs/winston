/*
 * stream.js: Transport for outputting to any arbitrary stream
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    isStream = require('isstream'),
    TransportStream = require('winston-transport');

//
// ### function Console (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var Stream = module.exports = function (options) {
  TransportStream.call(this, options);
  options = options || {};

  if (!options.stream || !isStream(options.stream)) {
    throw new Error('options.stream is required.');
  } else if (!options.stream._writableState.objectMode) {
    throw new Error('options.stream must be in objectMode');
  }

  //
  // We need to listen for drain events when
  // write() returns false. This can make node
  // mad at times.
  //
  this._stream = options.stream;
  this._stream.setMaxListeners(Infinity);
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Stream, TransportStream);

//
// ### function log (meta)
// #### @meta {Object} Additional metadata to attach
// Core logging method exposed to Winston.
//
Stream.prototype.log = function (info, callback) {
  //
  // TODO: DO some checking for the type of stream we are dealing with. WE
  // should handle more than object streams here if we want to accept receiving
  // a file stream that the user manages
  //
  this._stream.write(info);
  callback();
};
