/*
 * file-archive-test.js: Tests for instances of the File transport setting the archive option,
 *
 * (C) 2015 Nimrod Becker
 * MIT LICENSE
 *
 */

/* eslint-disable no-sync */
const assert = require('assert');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const winston = require('../../lib/winston');

const { MESSAGE } = require('triple-beam');

//
// Remove all log fixtures
//
function removeFixtures(done) {
  rimraf(path.join(__dirname, '..', 'fixtures', 'logs', 'testarchive*'), done);
}


let archiveTransport = null;

describe('winston/transports/file/zippedArchive', function () {
  describe('An instance of the File Transport with tailable true', function () {
    before(removeFixtures);
    after(removeFixtures);

    it('init logger AFTER cleaning up old files', function () {
      archiveTransport = new winston.transports.File({
        timestamp: true,
        json: false,
        zippedArchive: true,
        tailable: true,
        filename: 'testarchive.log',
        dirname: path.join(__dirname, '..', 'fixtures', 'logs'),
        maxsize: 4096,
        maxFiles: 3
      });
    });

    it('when created archived files are rolled', function (done) {
      let created = 0;
      let loggedTotal = 0;

      function data(ch, kb) {
        return String.fromCharCode(65 + ch).repeat(kb * 1024 - 1);
      }

      function logKbytes(kbytes, txt) {
        const toLog = {};
        toLog[MESSAGE] = data(txt, kbytes);
        archiveTransport.log(toLog);
      }

      archiveTransport.on('logged', function (info) {
        loggedTotal += info[MESSAGE].length + 1;
        if (loggedTotal >= 14 * 1024) { // just over 3 x 4kb files
          return done();
        }

        if (loggedTotal % 4096 === 0) {
          created++;
        }
        // eslint-disable-next-line max-nested-callbacks
        setTimeout(() => logKbytes(1, created), 1);
      });

      logKbytes(1, created);
    });

    it('should be only 3 files called testarchive.log, testarchive1.log.gz and testarchive2.log.gz', function () {
      for (var num = 0; num < 4; num++) {
        const file = !num ? 'testarchive.log' : 'testarchive' + num + '.log.gz';
        const fullpath = path.join(__dirname, '..', 'fixtures', 'logs', file);

        if (num === 3) {
          return assert.throws(function () {
            fs.statSync(fullpath);
          }, Error);
        }

        assert.doesNotThrow(function () {
          fs.statSync(fullpath);
        }, Error);
      }
    });
  });
});
