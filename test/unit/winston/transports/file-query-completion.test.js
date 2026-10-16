'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const winston = require('../../../../lib/winston');

describe('File query completion', () => {
  let directory;
  let transport;

  beforeEach(async () => {
    directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'winston-query-'));
    transport = new winston.transports.File({
      filename: path.join(directory, 'query.log'),
      lazy: true
    });
  });

  afterEach(async () => {
    transport.close();
    await fs.promises.rm(directory, { recursive: true, force: true });
  });

  function query() {
    const calls = [];
    return new Promise(resolve => {
      const createReadStream = fs.createReadStream;
      const spy = jest.spyOn(fs, 'createReadStream').mockImplementation((...args) => {
        const stream = createReadStream(...args);
        stream.once('close', () => {
          spy.mockRestore();
          // Run after all close listeners, including the query completion.
          setImmediate(() => resolve(calls));
        });
        return stream;
      });
      transport.query({ order: 'asc' }, (err, results) => {
        calls.push({ err, results });
      });
    });
  }

  it('completes a missing-file query once with an empty result', async () => {
    const calls = await query();
    assert.strictEqual(calls.length, 1);
    assert.ifError(calls[0].err);
    assert.deepStrictEqual(calls[0].results, []);
  });

  it('reports a read error once without a later successful result', async () => {
    await fs.promises.mkdir(path.join(directory, 'query.log'));
    const calls = await query();
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].err.code, 'EISDIR');
  });

  it('reports invalid JSON once without a later successful result', async () => {
    await fs.promises.writeFile(path.join(directory, 'query.log'), 'not json\n');
    const calls = await query();
    assert.strictEqual(calls.length, 1);
    assert(calls[0].err instanceof SyntaxError);
  });

  it('stops reporting errors after the first invalid record', async () => {
    await fs.promises.writeFile(path.join(directory, 'query.log'), 'not json\nalso invalid\n');
    const calls = await query();
    assert.strictEqual(calls.length, 1);
    assert(calls[0].err instanceof SyntaxError);
  });

  it('completes an empty-file query once', async () => {
    await fs.promises.writeFile(path.join(directory, 'query.log'), '');
    const calls = await query();
    assert.strictEqual(calls.length, 1);
    assert.ifError(calls[0].err);
    assert.deepStrictEqual(calls[0].results, []);
  });

  it('continues to ignore an incomplete trailing record', async () => {
    await fs.promises.writeFile(path.join(directory, 'query.log'), '{"message":');
    const calls = await query();
    assert.strictEqual(calls.length, 1);
    assert.ifError(calls[0].err);
    assert.deepStrictEqual(calls[0].results, []);
  });

  it('completes a valid query once', async () => {
    const log = { timestamp: new Date().toISOString(), level: 'info', message: 'orchid' };
    await fs.promises.writeFile(path.join(directory, 'query.log'), JSON.stringify(log) + '\n');
    const calls = await query();
    assert.strictEqual(calls.length, 1);
    assert.ifError(calls[0].err);
    assert.deepStrictEqual(calls[0].results, [log]);
  });
});
