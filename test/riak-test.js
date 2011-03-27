/*
 * riak-test.js: Tests for instances of the Riak transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

//require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
//
//var path = require('path'),
//    vows = require('vows'),
//    assert = require('assert'),
//    winston = require('winston'),
//    utils = require('winston/utils'),
//    helpers = require('./helpers');
//    
//var config = helpers.loadConfig(),
//    transport = new (winston.transports.Riak)(config.transports.riak);
//
//vows.describe('winston/transports/riak').addBatch({
//  "An instance of the Riak Transport": {
//    "should have the proper methods defined": function () {
//      helpers.assertRiak(transport);
//    },
//    "the log() method": helpers.testNpmLevels(transport, "should log messages to riak", function (ign, err, meta, result) {
//      assert.isNull(err);
//      assert.isObject(result);
//    })
//  }
//}).export(module);