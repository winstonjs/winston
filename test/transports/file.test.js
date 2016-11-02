'use strict';

var path = require('path'),
    winston = require('../../'),
    helpers = require('../helpers'),
    fs = require('fs'),
    split = require('split2'),
    assume = require('assume');

function noop() {};

describe('File({ filename })', function () {
  this.timeout(10 * 1000);

  it('should write to the file when logged to with expected object', function (done) {
    var filename = path.join(__dirname, '..', 'fixtures', 'file', 'simple.log');
    var transport = new winston.transports.File({
      filename: filename
    });

    var info = { raw: 'this is my log message' };
    var logged;

    transport.log(info, noop);
    setImmediate(function () {
      helpers.tryRead(filename)
        .on('error', function (err) {
          assume(err).false();
          done();
        })
        .pipe(split())
        .on('data', function (d) {
          assume(logged).true();
          assume(d).to.equal(info.raw);
        })
        .on('end', done);
    });

    transport.once('logged', function () {
      logged = true;
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
  it('should write to the stream when logged to with expected object', function (done) {
    var streamfile = path.join(__dirname, '..', 'fixtures', 'file', 'simple-stream.log');
    var stream = fs.createWriteStream(streamfile);
    var streamTransport = new winston.transports.File({
      stream: stream
    });

    done();
    //
    // TODO: Flesh out these assertions
    //
  });
});
