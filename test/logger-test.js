/*
 * interns-test.js: Tests for Loggly interns utility module
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var path = require('path'),
    vows = require('vows'),
    assert = require('assert');
    helpers = require('./helper');
    
    
require.paths.unshift(path.join(__dirname, '..', 'lib'));

var winston = require('winston');

vows.describe('winton/logger').addBatch({
  "The winston logger": {
    "the logger() method": {
      topic: function () {
       return new (winston.Logger)({transports: {"Console": {level: "info"}}});
      },
      "should return a winston Logger": function (logger) {
        helpers.assertLogger(logger);
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({transports: {}}),
    "The logger should start with 0 transports": {
      topic: function(logger) {
        return logger;
      }
    }, 
    "should return 0": function(logger) {
      assert.equal(helpers.size(logger.transports), 0);
    },
    "the add() with an unsupported transport": {
      topic: function (logger) {
       try {
         return logger.add("unsupported", {});
        }
       catch(err) {
        return err; 
       }
      },
      "should return an Error": function (err) {
       assert.instanceOf(err, Error);
      }
    },
    "the add() method with a supported method": {
      topic: function (logger) {       
         logger.add("Console", {});  
         return logger;
      },
      "should push a Console Transport onto transports": function (logger) {
        assert.equal(helpers.size(logger.transports), 1);
        helpers.assertConsole(logger.transports.Console);
      },
      "and adding an additional method": {
        topic: function (logger) {       
           logger.add("Riak", {}); 
           return logger;
        },
        "should be able to add multiple transports": function (logger) {
          assert.equal(helpers.size(logger.transports), 2);
          helpers.assertConsole(logger.transports.Console);
          helpers.assertRiak(logger.transports.Riak);
        }
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({transports: {Console: {}, Riak: {}}}),
    "The logger should start with 2 transports": {
      topic: function(logger) {
        return logger;
      }
    }, 
    "should return 2": function(logger) {
      assert.equal(helpers.size(logger.transports), 2);
    },
    "the remove() with an unadded transport": {
      topic: function (logger) {
       try {
         return logger.remove("Loggly");
        }
       catch(err) {
        return err; 
       }
      },
      "should return an Error": function (err) {
       assert.instanceOf(err, Error);
      }
    },
    "the remove() method with an added transport": {
      topic: function (logger) {
         logger.remove("Console");  
         return logger;
      },
      "should remove a Console Transport from transports": function (logger) {
        assert.equal(helpers.size(logger.transports), 1);
        helpers.assertRiak(logger.transports.Riak);
      },
      "and removing an additional transport": {
        topic: function (logger) {
           logger.remove("Riak");  
           return logger;
        },
        "should remove Riak Transport": function (logger) {
          assert.equal(helpers.size(logger.transports), 0);
        }
      }
    }
  }
}).export(module);