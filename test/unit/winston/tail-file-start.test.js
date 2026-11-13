'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const winston = require('../../../lib/winston');
const tailFile = require('../../../lib/winston/tail-file');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function firstLine({ start, seed = 'old\n', logger = false }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'winston-tail-start-'));
  const filename = path.join(directory, 'app.log');
  if (seed !== null) fs.writeFileSync(filename, seed);
  let instance;
  let stop;
  let writer;
  let timeout;

  try {
    return await new Promise((resolve, reject) => {
      if (logger) {
        instance = winston.createLogger({
          transports: [new winston.transports.File({ filename })]
        });
        const stream = instance.stream({ start });
        stream.once('log', log => resolve(log.message));
        stream.once('error', reject);
        stop = () => stream.destroy();
      } else {
        stop = tailFile({ file: filename, start }, (err, line) => {
          if (err) reject(err);
          else resolve(line);
        });
      }
      writer = setInterval(() => {
        if (instance) instance.info('new');
        else fs.appendFileSync(filename, 'new\n');
      }, 25);
      timeout = setTimeout(() => reject(new Error('No streamed record')), 6000);
    });
  } finally {
    clearInterval(writer);
    clearTimeout(timeout);
    if (stop) stop();
    if (instance) instance.close();
    await delay(1100);
    if (fs.existsSync(filename)) fs.unlinkSync(filename);
    fs.rmdirSync(directory);
  }
}

describe('file stream start positions', () => {
  jest.setTimeout(15000);

  it('starts the public Logger stream after existing records for start: -1', async () => {
    assert.strictEqual(await firstLine({
      start: -1,
      seed: '{"level":"info","message":"old"}\n',
      logger: true
    }), 'new');
  });

  it('uses the byte position after existing UTF-8 data for callback tails', async () => {
    assert.strictEqual(await firstLine({ start: -1, seed: '历史日志\n' }), 'new');
  });

  it('follows an empty file from its end', async () => {
    assert.strictEqual(await firstLine({ start: -1, seed: '' }), 'new');
  });

  it('creates and follows a missing file from its end', async () => {
    assert.strictEqual(await firstLine({ start: -1, seed: null }), 'new');
  });

  it('still reads existing records when start is omitted', async () => {
    assert.strictEqual(await firstLine({}), 'old');
  });

  it('preserves positive row offsets', async () => {
    assert.strictEqual(await firstLine({ start: 1, seed: 'zero\none\ntwo\n' }), 'two');
  });

  it.each([false, true])('reports a starting-position error and closes its fd (callback=%s)', async callback => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'winston-tail-error-'));
    const filename = path.join(directory, 'app.log');
    fs.writeFileSync(filename, 'old\n');
    const failure = new Error('Cannot stat the opened file');
    let descriptor;
    let stop;
    let timeout;
    let closeFinished;
    const closed = new Promise(resolve => { closeFinished = resolve; });
    const originalClose = fs.close;
    const statSpy = jest.spyOn(fs, 'fstat').mockImplementation((fd, done) => {
      descriptor = fd;
      process.nextTick(done, failure);
    });
    const closeSpy = jest.spyOn(fs, 'close').mockImplementation((fd, done) => {
      originalClose(fd, err => {
        done(err);
        closeFinished();
      });
    });
    try {
      const error = await new Promise((resolve, reject) => {
        timeout = setTimeout(() => reject(new Error('No startup error')), 6000);
        if (callback) {
          stop = tailFile({ file: filename, start: -1 }, err => resolve(err));
        } else {
          const stream = tailFile({ file: filename, start: -1 });
          stop = () => stream.destroy();
          stream.once('error', resolve);
          stream.once('line', () => reject(new Error('Read instead of reporting the stat failure')));
        }
      });
      assert.strictEqual(error, failure);
      await closed;
      assert.throws(() => fs.fstatSync(descriptor), { code: 'EBADF' });
    } finally {
      clearTimeout(timeout);
      if (stop) stop();
      await delay(1100);
      statSpy.mockRestore();
      closeSpy.mockRestore();
      fs.unlinkSync(filename);
      fs.rmdirSync(directory);
    }
  });
});
