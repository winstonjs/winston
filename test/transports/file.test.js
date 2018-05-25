'use strict';

const assume = require('assume');
const fs = require('fs');
const helpers = require('../helpers');
const { MESSAGE } = require('triple-beam');
const path = require('path');
const split = require('split2');
const winston = require('../../');

function noop() {}

describe('File({ filename })', function () {
  this.timeout(10 * 1000);

  it('should write to the file when logged to with expected object', done => {
    const filename = path.join(__dirname, '..', 'fixtures', 'file', 'simple.log');
    const transport = new winston.transports.File({ filename });

    const info = { [MESSAGE]: 'this is my log message' };
    let logged = 0;
    let read = 0;

    function cleanup() {
      fs.unlinkSync(filename); // eslint-disable-line no-sync
    }

    transport.log(info, noop);
    setImmediate(() => {
      helpers.tryRead(filename)
        .on('error', err => {
          assume(err).false();
          cleanup();
          done();
        })
        .pipe(split())
        .on('data', d => {
          assume(++read).lte(logged);
          assume(d).to.equal(info[MESSAGE]);
        })
        .on('end', () => {
          cleanup();
          done();
        });
    });

    transport.once('logged', () => {
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

describe('File({ stream })', () => {
  it('should display the deprecation notice');
  it('should write to the stream when logged to with expected object', done => {
    const streamfile = path.join(__dirname, '..', 'fixtures', 'file', 'simple-stream.log');
    const stream = fs.createWriteStream(streamfile);
    // eslint-disable-next-line no-unused-vars
    const streamTransport = new winston.transports.File({ stream });

    //
    // TODO: Flesh out these assertions
    //
    done();
  });
});

require('abstract-winston-transport')({
  name: 'File',
  Transport: winston.transports.File,
  construct: {
    filename: path.join(__dirname, '..', 'fixtures', 'file', 'abstract.log')
  },
  after(opts, done) {
    const abstractFile = opts.construct.filename;
    fs.unlink(abstractFile, done);
  }
});
