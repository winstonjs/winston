'use strict';

var path = require('path'),
    winston = require('../../'),
    fs = require('fs'),
    split = require('split2'),
    through = require('through2'),
    assume = require('assume');

var noop = function () {};

function tryRead(filename) {
  var proxy = through();
  (function inner() {
    var stream = fs.createReadStream(filename)
      .once('open', function () {
        stream.pipe(proxy);
      })
      .once('error', function (err) {
        if (err.code === 'ENOENT') {
          return setImmediate(inner);
        }
        proxy.emit('error', err);
      });
  })();
  return proxy;
}

describe('file.test', function () {
  this.timeout(3E5);
  var filename = path.join(__dirname, '..', 'fixtures', 'file', 'simple.log');
  var streamfile = path.join(__dirname, '..', 'fixtures', 'file', 'simple-stream.log');

  var stream = fs.createWriteStream(streamfile);
  var transport = new winston.transports.File({
    filename: filename
  });

  var streamTransport = new winston.transports.File({
    stream: stream
  });

  it('should write to the file when logged to with expected object', function (done) {
    var info = { raw: 'this is my log message' };
    transport.log(info, noop);
    setImmediate(function () {
      console.log('setImemdiate');
      tryRead(filename)
        .on('error', function (err) { console.log('fuck me'); done(); })
        .pipe(split())
        .on('data', function (d) {
          assume(d).to.equal(info.raw);
        })
        .on('end', done);
    });
    transport.once('logged', function () {
      console.log('logged');
    });
  });
});
