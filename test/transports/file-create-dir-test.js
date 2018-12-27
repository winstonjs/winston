'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const winston = require('../../lib/winston');

/* eslint-disable no-sync */

describe('winston/transports/file/createLogDir', function () {
  const logDir = path.resolve(__dirname, '../fixtures/temp_logs');

  beforeEach(function () {
    fs.rmdirSync(logDir);
  });

  it('should create directory if it does not exist', function () {
    winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'file.log')
        })
      ]
    });

    assert(fs.existsSync(logDir));
  });

  it('should create directory if it does not exist when write to the stream', function () {
    const streamfile = path.join(logDir, 'simple-stream.log');
    const stream = fs.createWriteStream(streamfile);

    winston.createLogger({
      transports: [
        new winston.transports.File({
          stream: stream
        })
      ]
    });

    assert(fs.existsSync(logDir));
  });
});
