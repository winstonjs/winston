/*
 * file-test.js: Tests for instances of the File transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const assume = require('assume');
const winston = require('../../');

const MESSAGE = Symbol.for('message');

//
// Remove all log fixtures
//
function removeFixtures(done) {
  rimraf(path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxsize*'), done);
}

describe('File (maxsize)', function () {
  this.timeout(10000);

  before(removeFixtures);
  after(removeFixtures);

  it('should create multiple files correctly when passed more than the maxsize', function (done) {
    const fillWith = ['a', 'b', 'c', 'd', 'e'];
    const maxsizeTransport = new winston.transports.File({
      level: 'info',
      format: winston.format.printf(info => info.message),
      filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxsize.log'),
      maxsize: 4096
    })

    //
    // Have to wait for `fs.stats` to be done in `maxsizeTransport.open()`.
    // Otherwise the maxsizeTransport._dest is undefined. See https://github.com/winstonjs/winston/issues/1174
    //
    setTimeout(() => logKbytes(4), 100);

    //
    // Setup a list of files which we will later stat.
    //
    const files = [];

    //
    // Assets all the files have been created with the
    // correct filesize
    //
    function assumeFilesCreated() {
      files.map(function (file, i) {
        let stats;
        try {
          stats = fs.statSync(file);
        } catch (ex) {
          assume(stats).is.an('object', `${file} failed to open: ${ex.message}`);
        }

        const text = fs.readFileSync(file, 'utf8');
        assume(text[0]).equals(fillWith[i]);
        // Either 4096 on Unix or 4100 on Windows
        // because of the eol.
        if (process.platform === 'win32') {
          assume(stats.size).equals(4100);
        } else {
          assume(stats.size).equals(4096);
        }
      });

      done();
    }

    //
    // Log the specified kbytes to the transport
    //
    function logKbytes(kbytes) {
      //
      // Shift the next fill char off the array then push it back
      // to rotate the chars.
      //
      const filler = fillWith.shift();
      fillWith.push(filler);

      //
      //
      // To not make each file not fail the assertion of the filesize we can
      // make the array 1023 characters long.
      //
      const kbStr = Array(1023).fill(filler).join('');

      //
      // With printf format that displays the message only
      // winston adds exactly 0 characters.
      //
      for (var i = 0; i < kbytes; i++) {
        maxsizeTransport.log({ level: 'info', [MESSAGE]: kbStr });
      }
    }

    maxsizeTransport.on('open', function (file) {
      const match = file.match(/(\d+)\.log$/);
      const count = match ? match[1] : 0;

      if (files.length === 5) {
        return assumeFilesCreated();
      }

      files.push(file);
      setImmediate(() => logKbytes(4));
    });
  });
});
