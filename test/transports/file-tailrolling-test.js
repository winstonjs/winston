'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vows = require('vows');
const winston = require('../../lib/winston');

const maxfilesTransport = new winston.transports.File({
  timestamp: false,
  json: false,
  filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testtailrollingfiles.log'),
  maxsize: 4096,
  maxFiles: 3,
  tailable: true
});

process.on('uncaughtException', err => {
  // eslint-disable-next-line no-console
  console.log('caught exception');
  // eslint-disable-next-line no-console
  console.error(err);
});

vows.describe('winston/transports/file/tailrolling').addBatch({
  'An instance of the File Transport': {
    'when delete old test files': {
      topic() {
        const logs = path.join(__dirname, '..', 'fixtures', 'logs');
        // eslint-disable-next-line no-sync
        fs.readdirSync(logs).forEach(file => {
          if (~file.indexOf('testtailrollingfiles')) {
            // eslint-disable-next-line no-sync
            fs.unlinkSync(path.join(logs, file));
          }
        });

        this.callback();
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
            if (++created === 4) {
              return this.callback();
            }

            logKbytes(4, created);
          });

          logKbytes(4, created);
        },
        'should be 3 log files, base to maxFiles - 1'() {
          let file;
          let fullpath;

          for (let num = 0; num < 4; num++) {
            file = !num ? 'testtailrollingfiles.log' : `testtailrollingfiles${num}.log`;
            fullpath = path.join(__dirname, '..', 'fixtures', 'logs', file);

            if (num === 3) {
              // eslint-disable-next-line no-sync
              return assert.ok(!fs.existsSync(fullpath));
            }

            // eslint-disable-next-line no-sync
            assert.ok(fs.existsSync(fullpath));
          }

          return false;
        },
        'should have files in correct order': () => {
          let file;
          let content;

          ['D', 'C', 'B'].forEach((letter, i) => {
            file = !i ? 'testtailrollingfiles.log' : `testtailrollingfiles${i}.log`;
            // eslint-disable-next-line no-sync
            content = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'logs', file), 'ascii');

            assert.lengthOf(content.match(new RegExp(letter, 'g')), 4068);
          });
        }
      }
    }
  }
}).export(module);
