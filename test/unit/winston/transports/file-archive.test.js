/*
 * file-archive-test.js: Tests for instances of the File transport setting the archive option,
 *
 * (C) 2015 Nimrod Becker
 * MIT LICENSE
 *
 */

/* eslint-disable no-sync */
const assert = require('assert');
const { rimraf } = require('rimraf');
const fs = require('fs');
const path = require('path');
const winston = require('../../../../lib/winston');
const testLogFixturesPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'logs');

const { MESSAGE } = require('triple-beam');

function removeFixtures() {
  rimraf(path.join(testLogFixturesPath, 'testarchive*'), { glob: true });
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


describe('File Transport with Archiving enabled', function () {
  let archiveTransport;
  // Helper function to log 4KB of data to trigger file rotation
  function logKbytesViaTransport(kbytes) {
    const kbStr = 'A'.repeat(1023); // 1023 chars + newline = 1024 bytes per log
    for (let i = 0; i < kbytes; i++) {
      const toLog = {};
      toLog[MESSAGE] = kbStr;
      archiveTransport.log(toLog);
    }
  }
  beforeEach(() => {
    removeFixtures();
  });

  afterEach(async () => {
    removeFixtures();
    // Allow time for file system operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  describe('Tailable enabled', function () {
    beforeAll(() => {
      archiveTransport = new winston.transports.File({
        timestamp: true,
        json: false,
        zippedArchive: true,
        tailable: true,
        filename: 'testarchive.log',
        dirname: testLogFixturesPath,
        maxsize: 4096,
        maxFiles: 3
      });
    });

    it('should create and properly roll archived files with maximum of 3 files', async function () {
      // We need to log enough data to create 3 files of 4KB each = 12KB total
      // Log data in chunks with slight delays to allow file rotation
      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Give file system operations time to complete archiving
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the expected files exist
      assertFileExists('testarchive.log');
      assertFileExists('testarchive1.log.gz');
      assertFileExists('testarchive2.log.gz');
      assertFileDoesNotExist('testarchive3.log.gz');
    });
  });

  describe('Tailable disabled', function () {
    beforeAll(() => {
      archiveTransport = new winston.transports.File({
        timestamp: true,
        json: false,
        zippedArchive: true,
        tailable: false,
        filename: 'testarchive.log',
        dirname: testLogFixturesPath,
        maxsize: 4096,
        maxFiles: 3
      });
    });

    it('should create and properly archive files with maximum of 3 files', async function () {
      // We need to log enough data to create 3 files of 4KB each = 12KB total
      // Log data in chunks with slight delays to allow file rotation
      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      logKbytesViaTransport(4);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Give file system operations time to complete archiving
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the expected files exist
      assertFileExists('testarchive1.log.gz');
      assertFileExists('testarchive2.log.gz');
      assertFileExists('testarchive3.log');
      assertFileDoesNotExist('testarchive3.log.gz');
    });
  });
});
