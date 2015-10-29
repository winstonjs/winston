/*
 * transports.js: Set of all transports Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var fs = require('fs'),
    path = require('path'),
    common = require('./common');

var transports = exports;

transports.__defineGetter__('Console', function () {
    return require('./transports/console.js')['Console'];
});

transports.__defineGetter__('File', function () {
    return require('./transports/file.js')['File'];
});
transports.__defineGetter__('Http', function () {
    return require('./transports/http.js')['Http'];
});

transports.__defineGetter__('Memory', function () {
    return require('./transports/memory.js')['Memory'];
});

transports.__defineGetter__('Transport', function () {
    return require('./transports/transport.js')['Transport'];
});

transports.__defineGetter__('Webhook', function () {
    return require('./transports/webhook.js')['Webhook'];
});

transports.__defineGetter__('Daily-Rotate-File', function () {
    return require('./transports/daily-rotate-file.js')['Daily-Rotate-File'];
});

