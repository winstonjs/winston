/*
 * index.js: Default settings for all levels that winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

const logform = require('logform');

//
// Export config sets
//
exports.cli    = logform.levels(require('./cli'));
exports.npm    = logform.levels(require('./npm'));
exports.syslog = logform.levels(require('./syslog'));

//
// Hoist addColors from logform where it was refactored
// into in winston@3.
//
exports.addColors = logform.levels;
