/*
 * transports.js: Set of all transports Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

Object.defineProperty(exports, 'Console', {
  configurable: true,
  enumerable: true,
  get: function () {
    return require('./console');
  }
});

Object.defineProperty(exports, 'File', {
  configurable: true,
  enumerable: true,
  get: function () {
    return require('./file');
  }
});

Object.defineProperty(exports, 'Http', {
  configurable: true,
  enumerable: true,
  get: function () {
    return require('./http');
  }
});

Object.defineProperty(exports, 'Stream', {
  configurable: true,
  enumerable: true,
  get: function () {
    return require('./stream');
  }
});
