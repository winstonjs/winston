/**
 * index.js: Default settings for all levels that winston knows about.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const logform = require('logform');

/**
 * Export config set for the CLI.
 * @type {Object}
 */
exports.cli = logform.levels(require('./cli'));

/**
 * Export config set for npm.
 * @type {Object}
 */
exports.npm = logform.levels(require('./npm'));

/**
 * Export config set for the syslog.
 * @type {Object}
 */
exports.syslog = logform.levels(require('./syslog'));

/**
 * Hoist addColors from logform where it was refactored into in winston@3.
 * @type {Object}
 */
exports.addColors = logform.levels;
