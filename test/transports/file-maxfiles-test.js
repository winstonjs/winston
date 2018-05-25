'use strict';

/*
 * file-maxfiles-test.js: Tests for instances of the File transport setting the max file size,
 * and setting a number for max files created.
 * maxSize * maxFiles = total storage used by winston.
 *
 * (C) 2011 Daniel Aristizabal
 * MIT LICENSE
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const vows = require('vows');
const winston = require('../../lib/winston');

const maxfilesTransport = new winston.transports.File({
  timestamp: false,
  json: false,
  filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxfiles.log'),
  maxsize: 4096,
  maxFiles: 3
});

vows.describe('winston/transports/file/maxfiles').addBatch({
  'An instance of the File Transport': {
    'when passed a valid filename': {
      'topic': maxfilesTransport,
      'should set the maxFiles option correctly': transportTest => {
        assert.isNumber(transportTest.maxFiles);
      }
    },
    'when delete old test files': {
      topic() {
        rimraf(path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxfiles*'), this.callback);
      },
      'and when passed more files than the maxFiles': {
        topic() {
          let created = 0;
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
              maxfilesTransport.log('info', data(txt), null, () => {});
            }
          }

          maxfilesTransport.on('logged', () => {
            if (++created === 6) {
              return this.callback();
            }

            logKbytes(4, created);
          });

          logKbytes(4, created);
        },
        'should be only 3 files called 5.log, 4.log and 3.log': () => {
          for (let num = 0; num < 6; num++) {
            const file = !num ? 'testmaxfiles.log' : `testmaxfiles${num}.log`;
            const fullpath = path.join(__dirname, '..', 'fixtures', 'logs', file);

            // There should be no files with that name
            if (num >= 0 && num < 3) {
              assert.throws(() => {
                // eslint-disable-next-line no-sync
                fs.statSync(fullpath);
              }, Error);
            } else {
              // The other files should be exist
              assert.doesNotThrow(() => {
                // eslint-disable-next-line no-sync
                fs.statSync(fullpath);
              }, Error);
            }
          }
        },
        'should have the correct content': () => {
          ['D', 'E', 'F'].forEach((name, inx) => {
            const counter = inx + 3;
            const logsDir = path.join(__dirname, '..', 'fixtures', 'logs');
            // eslint-disable-next-line no-sync
            const content = fs.readFileSync(path.join(logsDir, `testmaxfiles${counter}.log`), 'utf-8');

            // The content minus the 7 characters added by winston
            assert.lengthOf(content.match(new RegExp(name, 'g')), 4068);
          });
        }
      }
    }
  }
}).export(module);
