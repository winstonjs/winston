'use strict';

/* eslint-disable no-sync */
const assert = require('assert');
const { rimraf } = require('rimraf');
const fs = require('fs');
const path = require('path');
const winston = require('../../../../lib/winston');
const testLogFixturesPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'logs');

const { MESSAGE } = require('triple-beam');

function removeFixtures() {
  rimraf(path.join(testLogFixturesPath, 'test*'), { glob: true });
}
function getFilePath(filename) {
  return path.join(testLogFixturesPath, filename);
}
const assertFileExists = (filename) => {
  assert.doesNotThrow(
    () => fs.statSync(getFilePath(filename)),
    `Expected file ${filename} to exist`
  );
};
const assertFileDoesNotExist = (filename) => {
  assert.throws(
    () => fs.statSync(getFilePath(filename)),
    `Expected file ${filename} to not exist`
  );
};
const assertFileContentsStartWith = (filename, char) => {
  const fileContents = fs.readFileSync(getFilePath(filename), 'utf8');
  assert.strictEqual(
    fileContents[0],
    char,
    `Content of file ${filename} was not filled with ${char}`
  );
};


describe('File Transport', function () {
  const defaultTransportOptions = {
    timestamp: true,
    json: false,
    filename: 'testarchive.log',
    dirname: testLogFixturesPath,
    maxsize: 4096,
    maxFiles: 4
  };

  // Helper function to log 4KB of data to trigger file rotation
  async function logKbytesToTransport(transport, kbytes, char = 'A') {
    const kbStr = char.repeat(1023); // 1023 chars + newline = 1024 bytes per log
    for (let i = 0; i < kbytes; i++) {
      const logPayload = { level: 'info', [MESSAGE]: kbStr };
      transport.log(logPayload);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  beforeEach(() => {
    removeFixtures();
  });

  afterEach(async () => {
    removeFixtures();
    // Allow time for file system operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  describe('Filename Option', function () {
    it('should log to the file with the given filename', async function () {
      const expeectedFilename = 'testfilename.log';
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        filename: expeectedFilename
      });

      await logKbytesToTransport(transport, 1);

      assertFileExists(expeectedFilename);
    });
  });

  describe('Rotation Format option', function () {
    it('should create multiple files correctly with rotation Function', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        rotationFormat: () => {
          return '_';
        }
      });

      await logKbytesToTransport(transport, 4);

      await new Promise(resolve => setTimeout(resolve, 50));

      assertFileExists('testarchive.log');
      assertFileExists('testarchive_.log');
    });
  });

  describe('Archive option', function () {
    it('should archive log file when max size is exceeded', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        zippedArchive: true
      });

      await logKbytesToTransport(transport, 1);
      assertFileExists('testarchive.log');
      assertFileDoesNotExist('testarchive1.log');

      await logKbytesToTransport(transport, 4);
      assertFileExists('testarchive.log.gz');
      assertFileExists('testarchive1.log');

      await logKbytesToTransport(transport, 4);
      assertFileExists('testarchive1.log.gz');
      assertFileExists('testarchive2.log');
    });

    it('should not archive log file when max size is exceeded', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        zippedArchive: false
      });

      await logKbytesToTransport(transport, 1);
      assertFileExists('testarchive.log');
      assertFileDoesNotExist('testarchive1.log');

      await logKbytesToTransport(transport, 4);
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');

      await logKbytesToTransport(transport, 4);
      assertFileExists('testarchive1.log');
      assertFileExists('testarchive2.log');
    });
  });

  describe('Tailable option', function () {
    it('should write to original file and older files will be in ascending order', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        tailable: true
      });

      // We need to log enough data to create 3 files of 4KB each = 12KB total
      await logKbytesToTransport(transport, 4, 'A');
      await logKbytesToTransport(transport, 4, 'B');
      await logKbytesToTransport(transport, 4, 'C');

      // Give file system operations time to complete archiving
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the expected files exist and their contents are correct
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
      assertFileExists('testarchive2.log');
      assertFileExists('testarchive3.log');

      // Verify the contents of the files are in the expected order
      assertFileContentsStartWith('testarchive.log');
      assertFileContentsStartWith('testarchive1.log', 'C');
      assertFileContentsStartWith('testarchive2.log', 'B');
      // TODO: I would expect the first file that was rolled to be filled with the first log message
      // assertFileContentsStartWith('testarchive3.log', 'A');
    });

    it('should write to the newest file and older files will be in descending order', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        tailable: false
      });

      // We need to log enough data to create 3 files of 4KB each = 12KB total
      await logKbytesToTransport(transport, 4, 'A');
      await logKbytesToTransport(transport, 4, 'B');
      await logKbytesToTransport(transport, 4, 'C');

      // Give file system operations time to complete archiving
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the expected files exist
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
      assertFileExists('testarchive2.log');
      assertFileExists('testarchive2.log');

      // Verify the contents of the files are in the expected order
      assertFileContentsStartWith('testarchive.log');
      // TODO: only two of the files are filled and are not in the expected order
      // assertFileContentsStartWith('testarchive1.log', 'A');
      // assertFileContentsStartWith('testarchive2.log', 'B');
      // assertFileContentsStartWith('testarchive3.log', 'C');
    });
  });

  describe('Lazy option', () => {
    it('should not create log file until needed when lazy is enabled', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        lazy: true
      });

      await logKbytesToTransport(transport, 4);

      assertFileExists('testarchive.log');
      assertFileDoesNotExist('testarchive1.log');
    });

    it('should create log files on initializaiton when lazy is enabled', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        lazy: false
      });

      await logKbytesToTransport(transport, 4);


      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
      assertFileDoesNotExist('testarchive2.log');
    });
  });


  describe('Stream Option', function () {
    it.todo('should display the deprecation notice');
    it.todo('should write to the stream when logged to with expected object');
  });


  // TODO: Rewrite these tests in mocha
  //
  // "Error object in metadata #610": {
  //   topic: function () {
  //     var myErr = new Error("foo");
  //
  //     fileTransport.log('info', 'test message', myErr, this.callback.bind(this, null, myErr));
  //   },
  //   "should not be modified": function (err, myErr) {
  //     assert.equal(myErr.message, "foo");
  //     // Not sure if this is the best possible way to check if additional props appeared
  //     assert.deepEqual(Object.getOwnPropertyNames(myErr), Object.getOwnPropertyNames(new Error("foo")));
  //   }
  // }
  //
  // "Date object in metadata": {
  //   topic: function () {
  //     var obj = new Date(1000);
  //     fileTransport.log('info', 'test message', obj, this.callback.bind(this, null, obj));
  //   },
  //   "should not be modified": function (err, obj) {
  //     // Not sure if this is the best possible way to check if additional props appeared
  //     assert.deepEqual(Object.getOwnPropertyNames(obj), Object.getOwnPropertyNames(new Date()));
  //   }
  // }
  //
  // "Plain object in metadata": {
  //   topic: function () {
  //     var obj = { message: "foo" };
  //     fileTransport.log('info', 'test message', obj, this.callback.bind(this, null, obj));
  //   },
  //   "should not be modified": function (err, obj) {
  //     assert.deepEqual(obj, { message: "foo" });
  //   }
  // }
  //
  // "An instance of the File Transport": require('./transport')(winston.transports.File, {
  //   filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log')
  // })
});

