'use strict';

/*
 * formats.test.js: Integration tests for winston.format
 *
 * (C) 2015 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const path = require('path');
const spawn = require('cross-spawn-async');

const targetScript = path.join(__dirname, '..', 'helpers', 'scripts', 'colorize.js');

/**
 * Spawns the colorizer helper process for checking
 * if colors work in a non-tty environment
 * @param {Function} callback - Callback function to end the child process.
 * @returns {void}
 */
function spawnColorizer(callback) {
  const child = spawn(process.execPath, [targetScript], {
    stdio: 'pipe'
  });
  let data = '';

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', str => {
    data += str;
  });
  child.on('close', () => {
    callback(null, data);
  });
}

describe('winston.format.colorize (Integration)', () => {
  it('non-TTY environment', done => {
    spawnColorizer((err, data) => {
      assume(err).equals(null);
      assume(data).includes('\u001b[32mSimply a test\u001b[39m');
      done();
    });
  });
});
