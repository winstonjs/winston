/*
 * browserTransports.js: Set of all browser transports Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var common = require ('./common');

var browserTransports = exports;

//
// Setup all browser transports
//
var transports = [
    require('./transports/browserConsole')
]
