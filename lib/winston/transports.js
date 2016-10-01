/*
 * transports.js: Set of all transports Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

Object.defineProperty(exports, 'Console', {
  get: function () {
    return require('./transports/console')
  }
});
Object.defineProperty(exports, 'File', {
  get: function () {
    return require('./transports/file');
  }
});
Object.defineProperty(exports, 'Http', {
  get: function () {
    return require('./transports/http');
  }
});
Object.defineProperty(exports, 'Memory', {
  get: function () {
    return require('./transports/memory');
  }
});
