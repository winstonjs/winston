'use strict';

const path = require('path');
const winston = require('../../../../lib/winston');
const helpers = require('../../../helpers');
const fs = require('fs');
const { MESSAGE } = require('triple-beam');
const split = require('split2');
const assume = require('assume');
const testFileFixturesPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'file');

function noop() {};

describe('File({ filename })', function () {
  jest.setTimeout(10 * 1000);

  it('should write to the file when logged to with expected object', function (done) {
    var filename = path.join(testFileFixturesPath, 'simple.log');
    var transport = new winston.transports.File({
      filename: filename
    });

    var info = { [MESSAGE]: 'this is my log message' };
    var logged = 0;
    var read = 0

    function cleanup() {
      fs.unlinkSync(filename);
    }

    transport.log(info, noop);
    setImmediate(function () {
      helpers.tryRead(filename)
        .on('error', function (err) {
          assume(err).false();
          cleanup();
          done();
        })
        .pipe(split())
        .on('data', function (d) {
          assume(++read).lte(logged);
          assume(d).to.equal(info[MESSAGE]);
        })
        .on('end', function () {
          cleanup();
          done();
        });
    });

    transport.once('logged', function () {
      logged++;
    });
  });

  //
  // TODO: Rewrite these tests in mocha
  //
  // "Error object in metadata #610": {
  //   topic: function () {
  //     var myErr = new Error("foo");
  //
  //     fileTransport.log('info', 'test message', myErr, this.callback.bind(this, null, myErr));
  //   },
  //   "should not be modified": function (err, myErr) {
  //     assert.equal(myErr.message, "foo");
  //     // Not sure if this is the best possible way to check if additional props appeared
  //     assert.deepEqual(Object.getOwnPropertyNames(myErr), Object.getOwnPropertyNames(new Error("foo")));
  //   }
  // }
  //
  // "Date object in metadata": {
  //   topic: function () {
  //     var obj = new Date(1000);
  //     fileTransport.log('info', 'test message', obj, this.callback.bind(this, null, obj));
  //   },
  //   "should not be modified": function (err, obj) {
  //     // Not sure if this is the best possible way to check if additional props appeared
  //     assert.deepEqual(Object.getOwnPropertyNames(obj), Object.getOwnPropertyNames(new Date()));
  //   }
  // }
  //
  // "Plain object in metadata": {
  //   topic: function () {
  //     var obj = { message: "foo" };
  //     fileTransport.log('info', 'test message', obj, this.callback.bind(this, null, obj));
  //   },
  //   "should not be modified": function (err, obj) {
  //     assert.deepEqual(obj, { message: "foo" });
  //   }
  // }
  //
  // "An instance of the File Transport": require('./transport')(winston.transports.File, {
  //   filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log')
  // })
});

describe('File({ stream })', function () {
  it.todo('should display the deprecation notice');
  it.todo('should write to the stream when logged to with expected object');
});
