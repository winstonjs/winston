'use strict';

const {
  createLogger,
  format,
  transports
}  = require('../');

const logger = createLogger({
  format: format.combine(
    format.simple(),
    format.json(),
    format.colorize({
        all: true,
    }),
    format.prettyPrint()
),
  
transports: [
  new transports.File({
      filename: "quick-start-combined.log",
  }),
],
exceptionHandlers: [
  new transports.File({
      filename: "exceptions.log"
  }),
  new transports.Console()
],
});

throw new Error('Hello, winston!');
