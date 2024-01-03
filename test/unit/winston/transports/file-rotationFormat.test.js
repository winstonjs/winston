'use strict';

const path = require('path');
const winston = require('../../../../lib/winston');
const helpers = require('../../../helpers');
const fs = require('fs');
const { MESSAGE } = require('triple-beam');
const split = require('split2');
const assume = require('assume');
const { rimraf } = require('rimraf');
const testFileFixturesPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'fixtures',
  'file'
);

//
// Remove all log fixtures
//
function removeFixtures(done) {
  rimraf(path.join(testFileFixturesPath, 'rotation*'), {glob: true}).then(() => done());
}

// Validate Filename according to rotation
function isCorrectFormat(filename) {
  let time = filename.split('rotation')[1].split('.')[0];
  return new Date(time).getTime() > 0;
}

describe('winston/transports/file/rotationFormat', function () {
  this.timeout(10000);

  let testDone = false;
  before(removeFixtures);
  after(done => {
    testDone = true;
    removeFixtures(done);
  });
  
  it('should create multiple files correctly with rotation Function', function (done) {
    const fillWith = ['a', 'b', 'c', 'd', 'e'];
    const rotationTransport = new winston.transports.File({
      level: 'info',
      format: winston.format.printf(info => info.message),
      filename: path.join(testFileFixturesPath, 'rotation.log'),
      maxsize: 4096,
      rotationFormat: () => {
        return new Date().getTime();
      }
    });

    //
    // Have to wait for `fs.stats` to be done in `rotationTransport.open()`.
    // Otherwise the rotationTransport._dest is undefined. See https://github.com/winstonjs/winston/issues/1174
    //

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
          assume(stats).is.an(
            'object',
            `${file} failed to open: ${ex.message}`
          );
        }

        const text = fs.readFileSync(file, 'utf8');
        assume(text[0]).equals(fillWith[i]);
        assume(isCorrectFormat(file));
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
        rotationTransport.log({ level: 'info', [MESSAGE]: kbStr });
      }
    }

    rotationTransport.on('open', function (file) {

      if (testDone) return; // ignore future notifications
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
