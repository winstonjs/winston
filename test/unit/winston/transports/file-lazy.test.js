'use strict';

const path = require('path');
const winston = require('../../../../lib/winston');
const helpers = require('../../../helpers');
const fs = require('fs');
const { MESSAGE } = require('triple-beam');
const split = require('split2');
const assume = require('assume');

function noop() {}

describe('Lazy Option Test', function () {
  this.timeout(10 * 1000);
  var logPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'fixtures',
    'file',
    'lazy.log'
  );

  beforeEach(function () {
    try {
      fs.unlinkSync(logPath);
    } catch (ex) {
      if (ex && ex.code !== 'ENOENT') {
        return done(ex);
      }
    }
  });

  it('should not create a log file before receiving any logs', function (done) {
    var transport = new winston.transports.File({
      filename: logPath,
      lazy: true
    });

    setTimeout(function () {
      assume(fs.existsSync(logPath)).false();
      done();
    }, 0);
  });
  it('should create a log file after receiving log', function (done) {
    var transport = new winston.transports.File({
      filename: logPath,
      lazy: true
    });

    var info = { [MESSAGE]: 'this is my log message' };

    transport.log(info, noop);

    setTimeout(function () {
      assume(fs.existsSync(logPath));
      done();
    }, 0);
  });
});
