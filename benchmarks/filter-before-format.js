'use strict';

// Run with: node benchmarks/filter-before-format.js
// This measures logging-loop work, not application throughput or transport I/O.
const assert = require('assert');
const { performance } = require('perf_hooks');
const winston = require('../lib/winston');

const count = 100000;

function run(level, filterBeforeFormat, instrument) {
  let formatted = 0;
  let emitted = 0;
  const format = winston.format.combine(
    winston.format.label({ label: 'benchmark' }),
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.metadata({ fillExcept: ['level', 'timestamp', 'label', 'message'] }),
    winston.format.printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`)
  );
  if (instrument) {
    const transform = format.transform;
    format.transform = function (...args) {
      formatted++;
      return transform.apply(this, args);
    };
  }

  const transport = new winston.transports.Console();
  // Retain the transport's real level filtering, without console I/O in timings.
  transport.log = instrument
    ? (info, callback) => { emitted++; callback(); }
    : (info, callback) => callback();
  const logger = winston.createLogger({
    level: 'info', filterBeforeFormat, format, transports: [transport]
  });
  const start = performance.now();
  for (let i = 0; i < count; i++) logger.log(level, 'message', { request: 123 });
  const elapsedMs = performance.now() - start;
  assert.strictEqual(logger.readableLength, 0);
  assert.strictEqual(logger.writableLength, 0);
  logger.close();
  logger.destroy();
  transport.destroy();
  return { formatted, emitted, elapsedMs };
}

async function main() {
  const results = {};
  for (const level of ['debug', 'info']) {
    const baseline = run(level, false, true);
    const filtered = run(level, true, true);
    assert.strictEqual(baseline.formatted, count);
    assert.strictEqual(filtered.formatted, level === 'debug' ? 0 : count);
    assert.strictEqual(baseline.emitted, level === 'debug' ? 0 : count);
    assert.strictEqual(filtered.emitted, baseline.emitted);

    const samples = { baseline: [], filtered: [] };
    for (let round = -2; round < 9; round++) {
      for (const enabled of round % 2 === 0 ? [false, true] : [true, false]) {
        const result = run(level, enabled, false);
        if (round >= 0) samples[enabled ? 'filtered' : 'baseline'].push(result.elapsedMs);
        await new Promise(setImmediate);
      }
    }
    const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    results[level] = {
      counts: {
        baseline: { formatted: baseline.formatted, emitted: baseline.emitted },
        filtered: { formatted: filtered.formatted, emitted: filtered.emitted }
      },
      medianMs: { baseline: median(samples.baseline), filtered: median(samples.filtered) },
      samples
    };
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    node: process.version, platform: process.platform, arch: process.arch,
    winston: winston.version, count, results
  }, null, 2));
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
