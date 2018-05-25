'use strict';

const assume = require('assume');
const { MESSAGE } = require('triple-beam');
const os = require('os');
const winston = require('../../');
const { writeable } = require('../helpers');

describe('Stream({ stream })', () => {
  it('should support objectMode streams', done => {
    const expected = {
      level: 'info',
      message: 'lolwut testing!'
    };

    const stream = writeable(info => {
      assume(info).equals(expected);
      done();
    });

    const transport = new winston.transports.Stream({ stream });
    transport.log(expected);
  });

  it('should support UTF8 encoding streams', done => {
    const expected = {
      level: 'info',
      message: 'lolwut testing!',
      [MESSAGE]: 'info: lolwut testing!'
    };

    const stream = writeable(raw => {
      assume(raw.toString()).equals(`${expected[MESSAGE]}${os.EOL}`);
      done();
    }, false);

    const transport = new winston.transports.Stream({ stream });
    transport.log(expected);
  });

  it('should throw when not passed a stream', () => {
    assume(() => new winston.transports.Stream())
      .throws('options.stream is required.');'';
  });
});
