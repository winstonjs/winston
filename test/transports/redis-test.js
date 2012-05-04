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

vows.describe('winston/transports/redis').addBatch({
  'An instance of the Redis Transport': transport(winston.transports.Redis, {
    host: 'localhost',
    port: 6379
  })
}).export(module);
