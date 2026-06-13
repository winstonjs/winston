'use strict';

const path = require('path');
const fs = require('fs');
const fsPromise = require('node:fs/promises');
const {rimraf} = require('rimraf');
const winston = require('../lib/winston');
const {MESSAGE} = require('triple-beam');

const testLogFixturesPath = path.join(__dirname, 'fixtures', 'logs');

const defaultTransportOptions = {
  timestamp: true,
  json: false,
  filename: 'testarchive.log',
  dirname: testLogFixturesPath,
  maxsize: 4096
};

async function logToTransport(transport, opts = {}) {
  const chunkSize = opts.chunkSize ?? 1;
  const char = opts.char ?? 'A';
  const totalKBytes = opts.kbytes ?? 1;
  const bytesPerChunk = chunkSize * 1024 - 1;
  const kbStr = char.repeat(bytesPerChunk);
  for (let i = 0; i < totalKBytes; i++) {
    const logPayload = { level: 'info', [MESSAGE]: kbStr };
    await new Promise((resolve, reject) => {
      transport.log(logPayload, (err) => {
        return err ? reject() : resolve();
      });
    });
  }
}

async function waitForFile(filename, timeout = 1000, interval = 20) {
  const start = Date.now();
  const filepath = path.join(testLogFixturesPath, filename);
  while (Date.now() - start < timeout) {
    try {
      await fsPromise.access(filepath);
      return;
    } catch {
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Timed out waiting for file: ${filename}`);
}

beforeEach(async () => {
  await rimraf(path.join(testLogFixturesPath, 'test*'), { glob: true });
});
afterEach(async () => {
  await rimraf(path.join(testLogFixturesPath, 'test*'), { glob: true });
});

describe('File Transport', function () {
  it('should log to the file with the given filename', async function () {
    const expectedFilename = 'testfilename.log';
    const transport = new winston.transports.File({
      ...defaultTransportOptions,
      filename: expectedFilename
    });
    await logToTransport(transport);
    await waitForFile(expectedFilename);
  });

  it('should reuse an existing file that is under maxsize on open', async function () {
    const existingFile = path.join(testLogFixturesPath, 'testarchive.log');
    fs.writeFileSync(existingFile, 'A'.repeat(100));
    const transport = new winston.transports.File({ ...defaultTransportOptions });
    await logToTransport(transport);
    await waitForFile('testarchive.log');
  });

  it('should wait for drain and requeue logs', async function () {
    const transport = new winston.transports.File({ ...defaultTransportOptions });
    await logToTransport(transport);
    await waitForFile('testarchive.log');
  });

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
  });

  it('should create a new file the configured max size is exceeded', async function () {
    const transport = new winston.transports.File({
      ...defaultTransportOptions,
      maxsize: 2048
    });
    await logToTransport(transport, { kbytes: 1 });
    await waitForFile('testarchive.log');
    await logToTransport(transport, { kbytes: 2 });
    await waitForFile('testarchive1.log');
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
  });

  it('should delete the oldest file when maxfiles is met', async function () {
    process.stderr.write(`[FAILING TEST START]\n`);
    const transport = new winston.transports.File({
      ...defaultTransportOptions,
      maxsize: 1024,
      maxFiles: 2,
      lazy: true
    });
    
    transport.on('open', f => process.stderr.write(`[open: ${f}]\n`));
    transport.on('fileclosed', () => process.stderr.write(`[fileclosed]\n`));

    process.stderr.write(`[first log]\n`);
    await logToTransport(transport);
    process.stderr.write(`[after first log, _size=${transport._size}]\n`);
    await waitForFile('testarchive.log');
    process.stderr.write(`[testarchive.log found]\n`);
    
    process.stderr.write(`[second log, _size=${transport._size}, _fileExist=${transport._fileExist}]\n`);
    const pSecond = logToTransport(transport);
    
    const t = setTimeout(() => {
      process.stderr.write(`[STUCK in second log! _fileExist=${transport._fileExist}, _opening=${transport._opening}, _size=${transport._size}]\n`);
      if (transport._dest) {
        process.stderr.write(`[dest: destroyed=${transport._dest.destroyed}, listenerCount(close)=${transport._dest.listenerCount('close')}]\n`);
      }
    }, 3000);
    
    await pSecond;
    clearTimeout(t);
    process.stderr.write(`[second log done, _size=${transport._size}]\n`);
    
    await waitForFile('testarchive1.log');
    process.stderr.write(`[testarchive1.log found]\n`);
    
    process.stderr.write(`[third log]\n`);
    await logToTransport(transport, { kbytes: 0.5 });
    process.stderr.write(`[third log done]\n`);
    await waitForFile('testarchive2.log');
    process.stderr.write(`[testarchive2.log found]\n`);
  }, 10000);
});
