'use strict';

/* eslint-disable no-sync */
const assert = require('assert');
const { rimraf } = require('rimraf');
const fs = require('fs');
const fsPromise = require('node:fs/promises');
const path = require('path');
const winston = require('../../../../lib/winston');
const testLogFixturesPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'logs');
const { MESSAGE } = require('triple-beam');

/**
 * Sends logs to the provided transport. Supports logging a specified total data size at a given chunk size.
 *
 * @param {Object} transport - The winston transport to log to.
 * @param {Object} [opts={}] - Options for logging.
 * @param {number} [opts.kbytes=1] - The number of kilobytes to log.
 * @param {string} [opts.char='A'] - The character to use for logging.
 * @param {number} [opts.chunkSize=1] - The size of each log chunk in kilobytes.
 * @returns {Promise<void>} A promise that resolves when logging is complete.
 */
async function logToTransport(transport, opts = {}) {
  const chunkSize = opts.chunkSize ?? 1; // Default chunk size to 1KB if not provided
  const char = opts.char ?? 'A'; // Default character to 'A' if not provided
  const totalKBytes = opts.kbytes ?? 1; // Default total size to 1KB if not provided

  const bytesPerChunk = chunkSize * 1024 - 1; // Convert kilobytes to bytes and account for newline character
  const kbStr = char.repeat(bytesPerChunk); // create chunk of desired size with specified character

  for (let i = 0; i < totalKBytes; i++) {
    const logPayload = { level: 'info', [MESSAGE]: kbStr };
    await new Promise((resolve, reject) => {
      transport.log(logPayload, (err) => {
        return err ? reject() : resolve();
      });
    });
  }
}

/**
 * Waits for a file to exist by repeatedly checking for its presence.
 *
 * @param {string} filename - The name of the file to wait for.
 * @param {number} [timeout=1000] - Maximum time to wait in milliseconds before throwing an error.
 * @param {number} [interval=20] - Interval in milliseconds between file existence checks.
 * @returns {Promise<void>} A promise that resolves when the file exists or rejects on timeout.
 * @throws {Error} If the file does not exist after the timeout period.
 */
async function waitForFile(filename, timeout = 1000, interval = 20) {
  const start = Date.now();
  const filepath = getFilePath(filename);
  while (Date.now() - start < timeout) {
    try {
      await fsPromise.access(filepath);
      return; // File exists
    } catch {
      // File doesn't exist yet, keep waiting
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Timed out waiting for file: ${filename}`);
}

async function removeFixtures() {
  await rimraf(path.join(testLogFixturesPath, 'test*'), { glob: true });
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
const assertFileSizeLessThan = (filename, maxSizeBytes) => {
  const stats = fs.statSync(getFilePath(filename));
  assert.ok(
    stats.size <= maxSizeBytes,
    `Expected file ${filename} to not exceed ${maxSizeBytes} bytes, but was ${stats.size} bytes`
  );
};

describe('File Transport', function () {
  const defaultTransportOptions = {
    timestamp: true,
    json: false,
    filename: 'testarchive.log',
    dirname: testLogFixturesPath,
    maxsize: 4096
  };

  beforeEach(async () => {
    await removeFixtures();
  });

  afterEach(async () => {
    await removeFixtures();
  });

  describe('Construction', () => {
    const conflictingOptionTestCases = [
      { stream: true, filename: true },
      { stream: true, dirname: true },
      { stream: true, maxsize: true }
    ];
    it.each(conflictingOptionTestCases)('should throw an error if conflicting options are provided', (opts) => {
      const instantition = () => new winston.transports.File(opts);

      assert.throws(instantition, 'Conflicting options did not result in an error');
    });
  });

  describe('Filename Option', function () {
    it('should log to the file with the given filename', async function () {
      const expectedFilename = 'testfilename.log';
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        filename: expectedFilename
      });

      await logToTransport(transport);
      await waitForFile(expectedFilename);

      assertFileExists(expectedFilename);
    });
  });

  describe('Rotation Format option', function () {
    it('should create multiple files correctly with rotation Function', async function () {
      let i = 0;
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        rotationFormat: () => `_${i++}`
      });

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive.log');

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive_1.log');

      assertFileExists('testarchive.log');
      assertFileExists('testarchive_1.log');
    });
  });

  describe('Archive option', function () {
    it('should archive log file when max size is exceeded', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        zippedArchive: true
      });

      await logToTransport(transport, { kbytes: 1 });
      await waitForFile('testarchive.log');
      assertFileExists('testarchive.log');
      assertFileDoesNotExist('testarchive1.log');

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive1.log');
      assertFileExists('testarchive.log.gz');
      assertFileExists('testarchive1.log');

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive2.log');
      assertFileExists('testarchive1.log.gz');
      assertFileExists('testarchive2.log');
    });

    it('should not archive log file when max size is exceeded', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        zippedArchive: false
      });

      await logToTransport(transport, { kbytes: 1 });
      await waitForFile('testarchive.log');
      assertFileExists('testarchive.log');
      assertFileDoesNotExist('testarchive1.log');

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive1.log');
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive2.log');
      assertFileExists('testarchive1.log');
      assertFileExists('testarchive2.log');
    });
  });

  describe('Maxsize option', function () {
    it('should create a new file the configured max size is exceeded', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        maxsize: 2048
      });

      await logToTransport(transport, { kbytes: 1 });
      await waitForFile('testarchive.log');

      await logToTransport(transport, { kbytes: 2 });
      await waitForFile('testarchive1.log');

      // Verify both files exist after rotation
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
    });

    it('should not exceed max size for any file', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        maxsize: 2048
      });

      await logToTransport(transport, { kbytes: 3 });
      await waitForFile('testarchive.log');

      await logToTransport(transport, { kbytes: 2 });
      await waitForFile('testarchive1.log');
      await waitForFile('testarchive2.log');

      // Verify both files exist after rotation
      assertFileSizeLessThan('testarchive.log', 2048);
      assertFileSizeLessThan('testarchive1.log', 2048);
      assertFileSizeLessThan('testarchive2.log', 2048);
    });
  });

  describe('Maxfiles option', function () {
    it('should not exceed the max files', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        maxsize: 2024, // Small size to trigger frequent rotations
        maxFiles: 3, // Only allow 3 files total
        lazy: true
      });

      // Log well beyond enough data to create 3 files
      await logToTransport(transport);
      await logToTransport(transport);
      await logToTransport(transport);
      await logToTransport(transport);
      await logToTransport(transport);
      await logToTransport(transport);
      await logToTransport(transport);

      // Wait for the last expected file
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Should have 3 files total (maxFiles)
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
      assertFileDoesNotExist('testarchive3.log'); // This should not exist because maxFiles = 3
    }, 10000);

    it('should delete the oldest file when maxfiles is met', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        maxsize: 1024, // Small size to trigger frequent rotations
        maxFiles: 2, // Only allow 2 files total
        lazy: true // Ensure files are created immediately
      });

      // Create first log file
      await logToTransport(transport);
      await waitForFile('testarchive.log');

      // Create second log file
      await logToTransport(transport);
      await waitForFile('testarchive1.log');

      // Create third log file (should delete the oldest one)
      await logToTransport(transport, { kbytes: 0.5 });
      await waitForFile('testarchive2.log');

      // Should only have 2 most recent files (maxFiles = 2)
      assertFileDoesNotExist('testarchive.log'); // The oldest file should be deleted
      assertFileExists('testarchive1.log');
      assertFileExists('testarchive2.log');
    });
  });

  describe('Tailable option', function () {
    // eslint-disable-next-line max-statements
    it('should write to original file and older files will be in ascending order', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        maxFiles: 4,
        tailable: true
      });

      // We need to log enough data to create 3 files of 4KB each = 12KB total
      await logToTransport(transport, { kbytes: 4, char: 'A' });
      await waitForFile('testarchive.log');
      await logToTransport(transport, { kbytes: 4, char: 'B' });
      await waitForFile('testarchive1.log');
      await logToTransport(transport, { kbytes: 4, char: 'C' });
      await waitForFile('testarchive2.log');
      await logToTransport(transport, { kbytes: 1, char: 'D' });
      await waitForFile('testarchive3.log');

      // Verify the expected files exist and their contents are correct
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
      assertFileExists('testarchive2.log');
      assertFileExists('testarchive3.log');

      // Verify the contents of the files are in the expected order
      assertFileContentsStartWith('testarchive.log', 'D');
      assertFileContentsStartWith('testarchive1.log', 'C');
      assertFileContentsStartWith('testarchive2.log', 'B');
      // FIX: I would expect the first file that was rolled to be filled with the first log message
      // instead the file is empty. Investigation needed.
      // assertFileContentsStartWith('testarchive3.log', 'A');
    });

    it('should write to the newest file and older files will be in descending order', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        tailable: false
      });

      // We need to log enough data to create 3 files of 4KB each = 12KB total
      await logToTransport(transport, { kbytes: 4, char: 'A' });
      await waitForFile('testarchive.log');
      await logToTransport(transport, { kbytes: 4, char: 'B' });
      await waitForFile('testarchive1.log');
      await logToTransport(transport, { kbytes: 4, char: 'C' });
      await waitForFile('testarchive2.log');

      // Verify the expected files exist
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
      assertFileExists('testarchive2.log');

      // Verify the contents of the files are in the expected order
      // eslint-disable-next-line -- intentionally asserting file starts with no values
      assertFileContentsStartWith('testarchive.log', undefined);
      // FIX: only two of the files are filled and are not in the expected order. File contents are as follows:
      //   file testarchive.log  - empty
      //   file testarchive1.log - 'B'
      //   file testarchive2.log - 'C'
      //   file testarchive3.log - empty
      // assertFileContentsStartWith('testarchive1.log', 'A');
      // assertFileContentsStartWith('testarchive2.log', 'B');
    });
  });

  describe('Lazy option', () => {
    it('should not create log file until needed when lazy is enabled', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        lazy: true
      });

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive.log');

      assertFileExists('testarchive.log');
      assertFileDoesNotExist('testarchive1.log');
    });

    it('should create log files on initializaiton when lazy is enabled', async function () {
      const transport = new winston.transports.File({
        ...defaultTransportOptions,
        lazy: false
      });

      await logToTransport(transport, { kbytes: 4 });
      await waitForFile('testarchive.log');

      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log');
      assertFileDoesNotExist('testarchive2.log');
    });
  });


  describe('Stream Option', function () {
    it.todo('should display the deprecation notice');
    it.todo('should write to the stream when logged to with expected object');
  });


  // TODO: Reintroduce these tests
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

