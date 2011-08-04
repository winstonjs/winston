/*
 * timestamp-func-test.js: Test function as timestamp option for transport
 *      { timestamp: function(){} } 
 *
 * (C) 2011 Tom Shinnick
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    events = require('events'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

var testfile_basename = 'timestamp-func-test';    

function testfile_path(ext) {
  return path.join(__dirname,'fixtures', testfile_basename + '.' + ext);
}


var fileSetFalsePath = testfile_path('set_false'),
    fileSetFalse = new (winston.transports.File)({
        filename:   fileSetFalsePath,
        timestamp:  false });

var fileSetTruePath = testfile_path('set_true'),
    fileSetTrue = new (winston.transports.File)({
        filename:   fileSetTruePath,
        timestamp:  true });

var fileSetFuncPath = testfile_path('with_func'),
    fileSetFunc = new (winston.transports.File)({
        filename:   fileSetFuncPath,
        timestamp:  logger_timestamp });


function remove_fixture_files(){
  fs.unlink(fileSetFalsePath, function(err){});
  fs.unlink(fileSetTruePath,  function(err){});
  fs.unlink(fileSetFuncPath,  function(err){});
}

remove_fixture_files();


function read_log_file(transport) {
  var file_path = path.join(transport.dirname,transport.filename);
  var file_data = fs.readFileSync(file_path, 'utf8');
//console.log('  (read_log_file(%j):', transport.filename);
//console.log('    (%d) %j', file_data.length, file_data);
  return file_data;
}


vows.describe('winston/transport/timestamp').addBatch({
    "When timestamp option is used": {
      "with file transport": {
        "with value set to false ": {
          topic:  function(){
            // We must wait until transport file has emitted the 'flush' 
            // event to be sure the file has been created and written
            var promise = new (events.EventEmitter);
            fileSetFalse.once('flush', function() {
              //console.log('  ( saw flush event from file transport )');
              promise.emit('success', true);
            });

            fileSetFalse.log('info', 'When a fake tree falls in the forest...', 
                                null, function(){});
            return promise;
          },
          "there is no timestamp": function() {
            var data = read_log_file(fileSetFalse);
            assert.match(data, /^info: /);
          },
        },

        "with value set to true ": {
          topic:  function(){
            // We must wait until transport file has emitted the 'flush' 
            // event to be sure the file has been created and written
            var promise = new (events.EventEmitter);
            fileSetTrue.once('flush', function() {
              //console.log('  ( saw flush event from file transport )');
              promise.emit('success', true);
            });

            fileSetTrue.log('info', 'When a real tree falls in the forest...', 
                                null, function(){});
            return promise;
          },
          "it has a defaulted timestamp": function() {
            var data = read_log_file(fileSetTrue);
            // '3 Aug 17:00:51 - info: When a tree falls in the forest...\n' 
            assert.match(data, /^\d\d? \w{3}/);
          },
        },

        "and function value": {
          topic:  function(){
            // We must wait until transport file has emitted the 'flush' 
            // event to be sure the file has been created and written
            var promise = new (events.EventEmitter);
            fileSetFunc.once('flush', function() {
              //console.log('  ( saw flush event from file transport )');
              promise.emit('success', true);
            });

            fileSetFunc.log('info', 'When a cultured tree falls in the forest...', 
                                null, function(){});
            return promise;
          },
          "it has a polished timestamp": function() {
            var data = read_log_file(fileSetFunc);
            assert.match(data, /^\d\d\d\d\d\d\d\d\./);
          },
        }
      }
    }
}).export(module);


function logger_timestamp() {
  return '20110803.171657';
}

//function logger_timestamp() {
//  return time_as_YYYYMMDDpHHMMSS(new Date());
//}
//
//function time_as_YYYYMMDDpHHMMSS( datetime ) {
//  return [        datetime.getFullYear(),
//           pad_2d(datetime.getMonth() + 1),
//           pad_2d(datetime.getDate()),
//           '.',
//           pad_2d(datetime.getHours()),
//           pad_2d(datetime.getMinutes()),
//           pad_2d(datetime.getSeconds()) ].join('');
//}
//
//function pad_2d(n) {
//  return n < 10 ? '0' + n.toString(10) : n.toString(10);
//}
