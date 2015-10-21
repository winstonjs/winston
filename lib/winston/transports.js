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

transports.__defineGetter__('CONSOLE', function () {
    return require('./transports/console.js')[name];
});

transports.__defineGetter__('FILE', function () {
    return require('./transports/file.js')[name];
});
transports.__defineGetter__('HTTP', function () {
    return require('./transports/http.js')[name];
});

transports.__defineGetter__('MEMORY', function () {
    return require('./transports/memory.js')[name];
});

transports.__defineGetter__('TRANSPORT', function () {
    return require('./transports/transport.js')[name];
});

transports.__defineGetter__('WEBHOOK', function () {
    return require('./transports/webhook.js')[name];
});

transports.__defineGetter__('DAILY-ROTATE-FILE', function () {
    return require('./transports/daily-rotate-file.js')[name];
});

