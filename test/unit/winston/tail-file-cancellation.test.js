'use strict';

const fs = require('fs');
const path = require('path');
const winston = require('../../../lib/winston');
const tailFile = require('../../../lib/winston/tail-file');

// All records fit in one read, so cancellation must stop the current chunk,
// not just prevent the next filesystem read.
describe('tailFile cancellation', () => {
  const filename = path.join(__dirname, '../../fixtures/logs/tail-cancellation.log');

  beforeAll(() => {
    fs.writeFileSync(filename, '{"message":"first"}\n{"message":"second"}\n');
  });

  afterAll(() => {
    fs.unlinkSync(filename);
  });

  it('ignores a filesystem read completed after destruction', () => {
    let completeRead;
    const open = jest.spyOn(fs, 'open').mockImplementation((file, flags, mode, cb) => cb(null, 123));
    const read = jest.spyOn(fs, 'read').mockImplementation((fd, buffer, offset, length, pos, cb) => {
      buffer.write('first\nsecond\n');
      completeRead = cb;
    });
    const close = jest.spyOn(fs, 'close').mockImplementation((fd, cb) => cb());
    try {
      const stream = tailFile({ file: filename });
      const line = jest.fn();
      const data = jest.fn();
      stream.on('line', line);
      stream.on('data', data);
      stream.destroy();
      completeRead(null, 13);
      expect(line).not.toHaveBeenCalled();
      expect(data).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledTimes(1);
    } finally {
      open.mockRestore();
      read.mockRestore();
      close.mockRestore();
    }
  });

  it('keeps delivering all records when the stream is not destroyed', done => {
    const messages = [];
    const stream = tailFile({ file: filename });
    stream.on('error', done);
    stream.on('line', line => {
      messages.push(JSON.parse(line).message);
      if (messages.length === 2) {
        stream.destroy();
        try {
          expect(messages).toEqual(['first', 'second']);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('stops emitting lines when destroyed by a line listener', done => {
    const lines = [];
    const stream = tailFile({ file: filename });
    stream.on('error', done);
    stream.on('line', line => {
      lines.push(JSON.parse(line).message);
      stream.destroy();
    });
    stream.once('close', () => {
      setImmediate(() => {
        try {
          expect(lines).toEqual(['first']);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  it('does not emit lines after being destroyed by a data listener', done => {
    const lines = [];
    const stream = tailFile({ file: filename });
    stream.on('error', done);
    stream.on('line', line => lines.push(line));
    stream.on('data', () => stream.destroy());
    stream.once('close', () => {
      setImmediate(() => {
        try {
          expect(lines).toEqual([]);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  it('stops public File stream records when destroyed by a log listener', done => {
    const transport = new winston.transports.File({ filename, lazy: true });
    const stream = transport.stream();
    const messages = [];
    stream.on('error', done);
    stream.once('log', info => {
      messages.push(info.message);
      stream.destroy();
      setImmediate(() => {
        try {
          expect(messages).toEqual(['first']);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
    stream.on('log', info => {
      if (info.message !== 'first') messages.push(info.message);
    });
  });
});
