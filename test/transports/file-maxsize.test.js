/*
 * file-test.js: Tests for instances of the File transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assert = require('assert');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const assume = require('assume');
const winston = require('../../');

const MESSAGE = Symbol.for('message');
const fillWith = ['a', 'b', 'c', 'd', 'e'];
const maxsizeTransport = new winston.transports.File({
  level: 'info',
  format: winston.format.printf(info => info.message),
  filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxsize.log'),
  maxsize: 4096
});

//
// Log the specified kbytes to the transport
//
function logKbytes (kbytes) {
  const filler = fillWith.shift();
  const kbStr = Array(1024).fill(filler).join('');
  fillWith.push(filler);

  //
  // With printf format that displays the message only
  // winston adds exactly 0 characters.
  //
  for (var i = 0; i < kbytes; i++) {
    maxsizeTransport.log({ level: 'info', [MESSAGE]: kbStr });
  }
}

//
// Remove all log fixtures
//
function removeFixtures(done) {
  exec('rm -rf ' + path.join(__dirname, '..', 'fixtures', 'logs', 'testmaxsize*'), done);
}

describe('File (maxsize)', function () {
  this.timeout(10000);

  before(removeFixtures);
  //after(removeFixtures);

  it('should create multiple files correctly when passed more than the maxsize', function (done) {
    //
    // Setup a list of files which we will later stat.
    //
    const files = [];

    //
    // Assets all the files have been created with the
    // correct filesize
    //
    function assumeFilesCreated() {
      files.forEach(function (file, i) {
        let stats;
        try {
          stats = fs.statSync(file);
        } catch (ex) {
          assume(stats).is.an('object', `${file} failed to open: ${ex.message}`);
        }

        const text = fs.readFileSync(file, 'utf8');
        assume(text[0]).equals(fillWith[i]);
        assume(stats.size).equals(4096);
      });

      done();
    }

    maxsizeTransport.on('open', function (file) {
      const match = file.match(/(\d+)\.log$/);
      const count = match ? match[1] : 0;

      files.push(file);
      if (files.length === 5) {
        return assumeFilesCreated();
      }

      setImmediate(() => logKbytes(4));
    });

    logKbytes(4);
  });
});
