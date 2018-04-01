'use strict';

const { createLogger, format, transports } = require('../');
const { combine, json } = format;

const severityLevelOnly = format(info => {
  info.severityLevel = info.level;
  delete info.level;
  return info;
});

const logger = createLogger({
  format: combine(
    severityLevelOnly(),
    json()
  ),
  transports: [
    new transports.Console(),
  ]
});

logger.info('This will print without { level }',  { 'foo': 'bar' });
logger.info('This will also print without { level }', { 'foo': 'bar' });

