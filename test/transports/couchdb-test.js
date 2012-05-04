/*
 * couchdb-test.js: Tests for instances of the Couchdb transport
 *
 * (C) 2011 Max Ogden
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    fs = require('fs'),
    http = require('http'),
    assert = require('assert'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers'),
    transport = require('./transport');

vows.describe('winston/transports/couchdb').addBatch({
  'An instance of the Couchdb Transport': transport(winston.transports.Couchdb, {
    host: 'localhost',
    port: 5984,
    db: 'logs'
  })
}).export(module);
