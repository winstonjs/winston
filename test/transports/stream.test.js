'use strict';

const path = require('path');
const writeable = require('../helpers').writeable;
const { MESSAGE } = require('triple-beam');
const winston = require('../../');
const split = require('split2');
const assume = require('assume');

describe('Stream({ stream })', function () {
  it('should support objectMode streams', function (done) {
    const expected = {
      level: 'info',
      message: 'lolwut testing!'
    };

    const stream = writeable(function (info) {
      assume(info).equals(expected);
      done();
    });

    const transport = new winston.transports.Stream({ stream });
    transport.log(expected);
  });

  it('should support UTF8 encoding streams', function (done) {
    const expected = {
      level: 'info',
      message: 'lolwut testing!',
      [MESSAGE]: 'info: lolwut testing!'
    };

    const stream = writeable(function (raw) {
      assume(raw.toString()).equals(expected[MESSAGE]);
      done();
    }, false);

    const transport = new winston.transports.Stream({ stream });
    transport.log(expected);
  });

  it('should throw when not passed a stream', function () {
    assume(function () {
      const stream = new winston.transports.Stream()
    }).throws('options.stream is required.');''
  });
});
