'use strict';

const os = require('os');
const { execFile } = require('child_process');
const path = require('path');
const winston = require('../../');
const helpers = require('../helpers');
const fs = require('fs');
const { MESSAGE } = require('triple-beam');
const split = require('split2');
const assume = require('assume');

function noop() {};

describe('File({ filename })', function () {
  this.timeout(10 * 1000);

  it('should flush when logger.end() invoked and process.exit immediately', (done) => {
    const logPath = path.join(__dirname, '../fixtures/logs/logger-end-and-process-exit.log');
    const scriptPath = path.join(__dirname, '../helpers/scripts/logger-end-and-process-exit.js');

    try {
      // eslint-disable-next-line no-sync
      fs.unlinkSync(logPath);
    } catch (err) {
      // ignore err
    }

    execFile('node', [scriptPath], (err) => {
      if (err) return done(err);
      fs.readFile(logPath, { encoding: 'utf8' }, (err, content) => {
        if (err) return done(err);
        assume(content).equals('{"seriously":true,"level":"info","message":"CHILL WINSTON!"}' + os.EOL);
        done();
      });
    });
  });

  it('should write to the file when logged to with expected object', function (done) {
    var filename = path.join(__dirname, '..', 'fixtures', 'file', 'simple.log');
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
  it('should display the deprecation notice');
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

require('abstract-winston-transport')({
  name: 'File',
  Transport: winston.transports.File,
  construct: {
    filename: path.join(__dirname, '..', 'fixtures', 'file', 'abstract.log')
  },
  after(opts, done) {
    const abstractFile = opts.construct.filename;
    fs.unlink(abstractFile, done.bind(null, null));
  }
});
