/*
 * Couchdb.js: Transport for logging to Couchdb
 *
 * (C) 2011 Max Ogden
 * MIT LICENSE
 *
 */

var events = require('events'),
    http = require('http'),
    util = require('util'),
    common = require('../common'),
    Transport = require('./transport').Transport,
    Stream = require('stream').Stream;

//
// ### function Couchdb (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Console transport object responsible
// for making arbitrary HTTP requests whenever log messages and metadata
// are received.
//
var Couchdb = exports.Couchdb = function (options) {
  Transport.call(this, options);

  this.name   = 'couchdb';
  this.db     = options.db;
  this.user   = options.user;
  this.pass   = options.pass;
  this.host   = options.host   || 'localhost';
  this.port   = options.port   || 5984;

  if (options.auth) {
    //
    // TODO: add http basic auth options for outgoing HTTP requests
    //
  }

  if (options.ssl) {
    //
    //  TODO: add ssl support for outgoing HTTP requests
    //
  }
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Couchdb, Transport);

//
// Expose the name of this Transport on the prototype
//
Couchdb.prototype.name = 'couchdb';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Couchdb.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var self = this,
      message = common.clone(meta || {}),
      options,
      req;

  message.level = level;
  message.message = msg;

  // Prepare options for outgoing HTTP request
  options = {
    host: this.host,
    port: this.port,
    path: "/" + this.db,
    method: "POST",
    headers: {"content-type": "application/json"}
  };

  if (options.user && options.pass) {
    options.headers["Authorization"] = "Basic " + new Buffer(options.user + ":" + options.pass).toString('base64');
  }

  // Perform HTTP logging request
  req = http.request(options, function (res) {
    //
    // No callback on request, fire and forget about the response
    //
    self.emit('logged', res);
  });

  req.on('error', function (err) {
    //
    // Propagate the `error` back up to the `Logger` that this
    // instance belongs to.
    //
    self.emit('error', err);
  });

  //
  // Write logging event to the outgoing request body
  //

  var params = meta || {};
  // RFC3339/ISO8601 format instead of common.timestamp()
  params.timestamp = new Date();
  params.message = msg;
  params.level = level;

  req.write(JSON.stringify({
    method: 'log',
    params: params
  }));

  req.end();

  // Always return true, regardless of any errors
  callback(null, true);
};

//
// ### function _ensureView (options)
// #### @callback {function} Callback to be executed.
// Ensure the timestamp view.
//

Couchdb.prototype._ensureView = function(callback) {
  var self = this;

  if (this._ensuredView) return callback();

  this._ensuredView = true;

  function checkDB() {
    self.client.exists(function(err, exists) {
      if (err) return callback(err);
      return !exists
        ? self.client.create(checkView)
        : checkView();
    });
  }

  function checkView(err) {
    if (err) return callback(err);
    self.client.get('_design/Logs', function(err, result) {
      return !err && result
        ? callback()
        : save();
    });
  }

  function save(err) {
    if (err) return callback(err);
    // If we were to ignore `from` and `until`,
    // this wouldn't be necessary. We could just
    // use .all() or _all_docs.
    self.client.save('_design/Logs', {
      views: {
        byTimestamp: {
          map: '(' + function(doc) {
            if (doc.method === 'log') {
              emit(doc.params.timestamp, doc);
            }
          } + ')'
        }
      }
    }, callback);
  }

  save();
};

//
// ### function _ensureClient (options)
// #### @options {Object} Set stream options
// Returns a log stream.
//

Couchdb.prototype.__defineGetter__('client', function() {
  return this._ensureClient();
});

Couchdb.prototype._ensureClient = function() {
  if (this._client) return this._client;
  var cradle = require('cradle').Connection;
  this._client = new cradle(this.host, this.port, {}).database(this.db);
  return this._client;
};

//
// ### function query (options)
// #### @options {Object} Set stream options
// #### @callback {function} Callback
// Query the transport.
//

Couchdb.prototype.query = function (options, callback) {
  var self = this,
      options = this.normalizeQuery(options),
      query = {};

  if (!this._ensuredView) {
    return this._ensureView(function(err) {
      if (err) return callback(err);
      self.query(options, callback);
    });
  }

  if (options.rows) query.limit = options.rows;
  if (options.start) query.skip = options.start;
  if (options.order === 'desc') {
    query.descending = true;
    if (options.from) query.endkey = options.from.toISOString();
    if (options.until) query.startkey = options.until.toISOString();
  } else {
    if (options.from) query.startkey = options.from.toISOString();
    if (options.until) query.endkey = options.until.toISOString();
  }

  this.client.view('Logs/byTimestamp', query, function(err, docs) {
    if (err) return callback(err);

    docs = docs.map(function(doc) {
      doc = doc.params;
      return doc;
    });

    if (options.fields) {
      docs.forEach(function(doc) {
        Object.keys(doc).forEach(function(key) {
          if (!~options.fields.indexOf(key)) {
            delete doc[key];
          }
        });
      });
    }

    callback(null, docs);
  });
};

//
// ### function stream (options)
// #### @options {Object} Set stream options
// Returns a log stream.
//

Couchdb.prototype.stream = function(options) {
  var self = this,
      options = options || {},
      stream = new Stream,
      feed;

  stream.destroy = function() {
    this.destroyed = true;
    try {
      feed.stop();
    } catch (e) {
      ;
    }
  };

  this.client.info(function(err, info) {
    if (err) return stream.emit('error', err);

    if (options.start === -1) {
      delete options.start;
    }

    if (options.start == null) {
      options.start = info.update_seq || 0;
    }

    // Possibly allow some kind
    // of basic querying here?
    feed = self.client.changes({
      include_docs: true,
      feed: 'continuous',
      style: 'main_only',
      descending: false,
      since: options.start
    });

    feed.on('change', function(change) {
      if (!change.deleted && change.doc && change.doc.params) {
        stream.emit('log', change.doc.params);
      }
    });

    feed.on('error', function(err) {
      stream.emit('error', err);
    });
  });

  return stream;
};
