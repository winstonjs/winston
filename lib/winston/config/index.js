/*
 * index.js: Default settings for all levels that winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var colors = require('colors/safe');

//
// Fix colors not appearing in non-tty environments
//
colors.enabled = true;

/**
 * @property {Object} allColors
 * All colors known to winston when attempting
 * to colorize strings.
 */
var allColors = exports.allColors = {};

/**
 * Adds the colors Object to the set of allColors
 * known by winston
 *
 * @param {Object} colors Set of color mappings to add.
 */
exports.addColors = function (colors) {
  Object.assign(allColors, colors);

  //
  // Eagerly set any colors that happen to be `/s`
  // separated strings into an Array to be used later.
  //
  Object.keys(allColors).forEach(function (level) {
    if (/\s/.test(allColors[level])) {
      allColors[level] = allColors[level].split(/\s+/);
    }
  });
};

exports.colorize = function (level, message) {
  if (typeof message === 'undefined') {
    message = level;
  }

  //
  // If the color for the level is just a string
  // then attempt to colorize the message with it.
  //
  if (!Array.isArray(allColors[level])) {
    return colors[allColors[level]](message);
  }

  //
  // If it is an Array then iterate over that Array, applying
  // the colors function for each item.
  //
  for (var i = 0, len = allColors[level].length; i < len; i++) {
    message = colors[allColors[level][i]](message);
  }

  return message;
};

//
// Export config sets
//
exports.cli    = require('./cli');
exports.npm    = require('./npm');
exports.syslog = require('./syslog');

//
// Add colors for pre-defined config sets
//
exports.addColors(exports.cli.colors);
exports.addColors(exports.npm.colors);
exports.addColors(exports.syslog.colors);
