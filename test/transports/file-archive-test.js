'use strict';

/*
 * file-archive-test.js: Tests for instances of the File transport setting the archive option,
 *
 * (C) 2015 Nimrod Becker
 * MIT LICENSE
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vows = require('vows');
const winston = require('../../lib/winston');

const archiveTransport = new winston.transports.File({
  timestamp: true,
  json: false,
  zippedArchive: true,
  tailable: true,
  filename: 'testarchive.log',
  dirname: path.join(__dirname, '..', 'fixtures', 'logs'),
  maxsize: 4096,
  maxFiles: 3
});

function data(ch) {
  return new Array(1018).join(String.fromCharCode(65 + ch));
}

function logKbytes(kbytes, txt) {
  //
  // With no timestamp and at the info level,
  // winston adds exactly 7 characters:
  // [info](4)[ :](2)[\n](1)
  //
  for (let i = 0; i < kbytes; i++) {
    archiveTransport.log('info', data(txt), null, () => {});
  }
}

vows.describe('winston/transports/file/zippedArchive').addBatch({
  'An instance of the File Transport with tailable true': {
    'when created archived files are rolled': {
      topic() {
        let created = 0;
        archiveTransport.on('logged', () => {
          if (++created === 6) {
            return this.callback();
          }

          logKbytes(4, created);
        });

        logKbytes(4, created);
      },
      'should be only 3 files called testarchive.log, testarchive1.log.gz and testarchive2.log.gz': () => {
        for (let num = 0; num < 6; num++) {
          const file = !num ? 'testarchive.log' : `testarchive${num}.log.gz`;
          const fullpath = path.join(__dirname, '..', 'fixtures', 'logs', file);

          // There should be no files with that name
          if (num >= 3) {
            assert.throws(() => {
              // eslint-disable-next-line no-sync
              fs.statSync(fullpath);
            }, Error);
          } else {
            // The other files should exist
            assert.doesNotThrow(() => {
              // eslint-disable-next-line no-sync
              fs.statSync(fullpath);
            }, Error);
          }
        }
      }
    }
  }
}).export(module);
