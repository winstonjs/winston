/**
 * index.js: Default settings for all levels that winston knows about.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const logform = require('logform');
const { configs } = require('triple-beam');

/**
 * Export config set for the CLI.
 * @type {Object}
 */
const cli = logform.levels(configs.cli);

/**
 * Export config set for npm.
 * @type {Object}
 */
const npm = logform.levels(configs.npm);

/**
 * Export config set for the syslog.
 * @type {Object}
 */
const syslog = logform.levels(configs.syslog);

/**
 * Hoist addColors from logform where it was refactored into in winston@3.
 * @type {Object}
 */
const addColors = logform.levels;

module.exports = {
  cli,
  npm,
  syslog,
  addColors
};
