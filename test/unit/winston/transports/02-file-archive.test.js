/*
 * file-archive-test.js: Tests for instances of the File transport setting the archive option,
 *
 */

/* eslint-disable no-sync */
const { rimrafSync } = require('rimraf');
const fs = require('fs');
const path = require('path');
const { MESSAGE } = require('triple-beam');
const assume = require('assume');
const zlib = require('zlib');
const winston = require('../../../../lib/winston');
const testLogFixturesPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'fixtures',
  'logs'
);


function removeFixtures(done) {
  rimrafSync(path.join(testLogFixturesPath, 'testarchive*'), {glob: true});
  done();
}

describe('winston/transports/file/zippedArchive', function () {
  this.beforeEach(removeFixtures);
  this.afterEach(removeFixtures);

  it('should not create zip when file is being used', function (done) {
    let archiveTransport = new winston.transports.File({
      zippedArchive: true,
      level: 'info',
      format: winston.format.printf(info => info.message),
      filename: path.join(testLogFixturesPath, 'testarchive.log'),
      maxsize: 4096
    });
    var info = { [MESSAGE]: 'this is my log message' };
    setTimeout(() => {
      archiveTransport.log(info);
    }, 100);

    archiveTransport.once('logged', function () {
      assume(fs.existsSync(path.join(testLogFixturesPath, 'testarchive.log')));
      assume(
        fs.existsSync(path.join(testLogFixturesPath, 'testarchive.log.gz'))
      ).false();
      done();
    });
  });

  it('should create multiple zip files', function (done) {
    const fillWith = ['a', 'b', 'c', 'd', 'e'];

    let archiveTransport = new winston.transports.File({
      zippedArchive: true,
      level: 'info',
      format: winston.format.printf(info => info.message),
      filename: path.join(testLogFixturesPath, 'testarchive.log'),
      maxsize: 4096
    });
    const logger = winston.createLogger({
      transports: [archiveTransport]
    });
    const files = [];

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
      for (var i = 0; i < kbytes; i++) {
        logger.log({ level: 'info', message: kbStr });
      }
    }

    function assumeFilesCreated() {
      files.map(function (file, i) {
        assume(fs.existsSync(file));
        const text = fs.readFileSync(file);

        content = zlib.gunzipSync(text).toString('utf8');
        assume(content.length).equal(4096);
        assume(content[0]).equal(fillWith[i]);
      });

      done();
    }

    archiveTransport.on('open', function (file) {
      if (files.length === 5) {
        assumeFilesCreated();
        return;
      }
      files.push(file + '.gz');
      setImmediate(() => logKbytes(4));
    });
  });

  it('should have correct no zip files with maxfiles', function (done) {
    const fillWith = ['a', 'b', 'c', 'd', 'e'];

    let archiveTransport = new winston.transports.File({
      zippedArchive: true,
      level: 'info',
      format: winston.format.printf(info => info.message),
      filename: path.join(testLogFixturesPath, 'testarchive.log'),
      maxsize: 4096,
      maxFiles: 3
    });
    const logger = winston.createLogger({
      transports: [archiveTransport]
    });
    const files = [];

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
      for (var i = 0; i < kbytes; i++) {
        logger.log({ level: 'info', message: kbStr });
      }
    }

    function assumeFilesCreated() {
      files.map(function (file, i) {
        if (i <= 2) {
          assume(fs.existsSync(file)).false();
          return;
        }
        const text = fs.readFileSync(file);
        content = zlib.gunzipSync(text).toString('utf8');
        assume(content.length).equal(4096);
        assume(content[0]).equal(fillWith[i]);
      });

      done();
    }

    archiveTransport.on('open', function (file) {
      const match = file.match(/(\d+)\.log$/);
      const count = match ? match[1] : 0;

      if (files.length === 5) {
        assumeFilesCreated();
        return;
      }
      files.push(file + '.gz');
      setImmediate(() => logKbytes(4));
    });
  });
  it('should have zip files with tailable', function (done) {
    const fillWith = ['a', 'b', 'c', 'd', 'e'];

    let archiveTransport = new winston.transports.File({
      zippedArchive: true,
      level: 'info',
      format: winston.format.printf(info => info.message),
      filename: path.join(testLogFixturesPath, 'testarchive.log'),
      maxsize: 4096,
      tailable: true,
      maxFiles: 3
    });
    const logger = winston.createLogger({
      transports: [archiveTransport]
    });
    let count = 0;
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
      for (var i = 0; i < kbytes; i++) {
        logger.log({ level: 'info', message: kbStr });
      }
    }

    function assumeFilesCreated() {
      for (let i = 0; i < 4; i++) {
        const file = !i ? 'testarchive.log' : 'testarchive' + i + '.log';
        if (i == 0) {
          const fullpath = path.join(testLogFixturesPath, file);
          assume(fs.existsSync(file));
          continue;
        }
        const fullpath = path.join(testLogFixturesPath, file + '.gz');
        if (i == 3) {
          assume(fs.existsSync(fullpath)).false();
          continue;
        }
        assume(fs.existsSync(fullpath));
      }
      done();
    }

    archiveTransport.on('open', function (file) {
      if (count === 5) {
        assumeFilesCreated();
        return;
      }
      count++;
      setImmediate(() => logKbytes(4));
    });
  });
  it('should not create extra file', function (done) {
    const fillWith = ['a', 'b', 'c', 'd', 'e'];
    let archiveTransport = new winston.transports.File({
      zippedArchive: true,
      level: 'info',
      format: winston.format.printf(info => info.message),
      filename: path.join(testLogFixturesPath, 'testarchive.log'),
      maxsize: 4096,
      lazy: true
    });
    const logger = winston.createLogger({
      transports: [archiveTransport]
    });
    //
    // Setup a list of files which we will later stat.
    //
    const files = [];

    //
    // Assets the no of files and all the files have been created with the
    // correct filesize
    //
    function assumeFilesCreated() {
      files.map(function (file, i) {
        if (i == fillWith.length - 1) {
          assume(fs.existsSync(file)).false();
          return;
        }
        const text = fs.readFileSync(file);
        content = zlib.gunzipSync(text).toString('utf8');
        assume(content.length).equal(4096);
        assume(content[0]).equal(fillWith[i]);
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
      for (var i = 0; i < kbytes; i++) {
        logger.log({ level: 'info', message: kbStr });
      }
    }

    // Initial Log
    let count = 0;
    logKbytes(4);

    // Listen to file close event called when the file is closed
    archiveTransport.on('fileclosed', () => {
      count += 1;
      if (count === fillWith.length) {
        assumeFilesCreated();
        return;
      }
      setImmediate(() => {
        logKbytes(4);
      });
    });

    //Listent to file open event called when the file is opened
    archiveTransport.on('open', file => {
      files.push(file + '.gz');
    });
  });
});
