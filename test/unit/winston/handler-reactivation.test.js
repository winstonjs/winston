'use strict';

const winston = require('../../../lib/winston');
const Transport = require('winston-transport');

// Exercise the public handler lifecycle without emitting process-wide errors.
describe.each([
  ['exceptions', 'exception'],
  ['rejections', 'rejection']
])('%s handler reactivation', (name, flag) => {
  it('resumes delivery to the same transport after unhandle', () => {
    const received = [];
    const transport = new Transport({
      log(info, callback) {
        received.push(info.message);
        callback();
      }
    });
    const logger = winston.createLogger({ exitOnError: false });
    const handler = logger[name];
    try {
      handler.handle(transport);
      logger.log({ level: 'error', message: 'before', [flag]: true });
      handler.unhandle();
      handler.handle(transport);
      logger.log({ level: 'error', message: 'after', [flag]: true });
      expect(received).toEqual(['before', 'after']);
    } finally {
      logger.close();
    }
  });

  it('restores registered transports without duplicating active handlers', () => {
    const received = [];
    const transport = new Transport({
      log(info, callback) {
        received.push(info.message);
        callback();
      }
    });
    const logger = winston.createLogger({ exitOnError: false });
    const handler = logger[name];
    try {
      handler.handle(transport);
      handler.unhandle();
      handler.handle();
      handler.handle(transport);
      logger.log({ level: 'error', message: 'once', [flag]: true });
      logger.log({ level: 'info', message: 'ordinary' });
      expect(received).toEqual(['once']);
    } finally {
      logger.close();
    }
  });
});
