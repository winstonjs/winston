/*
 * transports.js: Set of all transports Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var transports = exports;

transports.Console = require('./transports/console').Console;
transport.Loggly   = require('./transports/loggly').Loggly;
transports.Riak    = require('./transports/riak').Riak;
