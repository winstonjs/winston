/*
 * container.js: Inversion of control container for winston logger instances
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

const createLogger = require('./create-logger');
const extend = require('util')._extend;

//
// ### function Container (options)
// #### @options {Object} Default pass-thru options for Loggers
// Constructor function for the Container object responsible for managing
// a set of `winston.Logger` instances based on string ids.
//
var Container = exports.Container = function (options) {
  this.loggers = {};
  this.options = options || {};
};

//
// ### function get / add (id, options)
// #### @id {string} Id of the Logger to get
// #### @options {Object} **Optional** Options for the Logger instance
// Retreives a `winston.Logger` instance for the specified `id`. If
// an instance does not exist, one is created.
//
Container.prototype.get = Container.prototype.add = function (id, options) {
  const self = this;
  let existing;

  if (!this.loggers[id]) {
    //
    // Remark: Simple shallow clone for configuration options in case we pass in
    // instantiated protoypal objects
    //
    options = extend({}, options || this.options);
    existing = options.transports || this.options.transports;

    //
    // Remark: Make sure if we have an array of transports we slice it to make copies
    // of those references.
    //
    options.transports = existing ? existing.slice() : [];

    this.loggers[id] = createLogger(options);
    this.loggers[id].on('close', function () {
      self._delete(id);
    });
  }

  return this.loggers[id];
};

//
// ### function close (id)
// #### @id {string} **Optional** Id of the Logger instance to find
// Returns a boolean value indicating if this instance
// has a logger with the specified `id`.
//
Container.prototype.has = function (id) {
  return !!this.loggers[id];
};

//
// ### function close (id)
// #### @id {string} **Optional** Id of the Logger instance to close
// Closes a `Logger` instance with the specified `id` if it exists.
// If no `id` is supplied then all Loggers are closed.
//
Container.prototype.close = function (id) {
  var self = this;

  function removeLogger(id) {
    if (!self.loggers[id]) {
      return;
    }

    self.loggers[id].close();
    self._delete(id);
  }

  if (id) {
    return removeLogger(id);
  }

  Object.keys(this.loggers).forEach(removeLogger);
};

//
// ### @private function _delete (id)
// #### @id {string} Id of the Logger instance to delete from container
// Deletes a `Logger` instance with the specified `id`.
//
Container.prototype._delete = function (id) {
  delete this.loggers[id];
};

