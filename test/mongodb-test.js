/*
 * mongodb-test.js: Tests for instances of the MongoDB transport
 *
 * (C) 2011 Kendrick Taylor
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var path = require('path'),
   vows = require('vows'),
   assert = require('assert'),
   winston = require('winston'),
   utils = require('winston/utils'),
   helpers = require('./helpers');
   
var config = helpers.loadConfig(),
   transport = new (winston.transports.MongoDB)(config.transports.mongodb);

vows.describe('winston/transports/mongodb').addBatch({
 "An instance of the MongoDB Transport": {
   "should have the proper methods defined": function () {
     helpers.assertMongoDB(transport);
   },
   "the log() method": helpers.testNpmLevels(transport, "should log messages to MongoDB", function (ign, err, logged) {
     assert.isTrue(!err);
     assert.isTrue(logged);
   })
 }
}).export(module);