'use strict';

const winston = require('../');

/*
 * Simple string mask. For example purposes only.
 */
function maskCardNumbers(num) {
  const str = num.toString();
  const { length } = str;

  return Array.from(str, (n, i) => {
    return i < length - 4 ? '*' : n;
  }).join('');
}

// Define the format that mutates the info object.
const maskFormat = winston.format(info => {
  // You can CHANGE existing property values
  if (info.creditCard) {
    info.creditCard = maskCardNumbers(info.creditCard);
  }

  // You can also ADD NEW properties if you wish
  info.hasCreditCard = !!info.creditCard;

  return info;
});

// Then combine the format with other formats and make a logger
const logger = winston.createLogger({
  format: winston.format.combine(
    //
    // Order is important here, the formats are called in the
    // order they are passed to combine.
    //
    maskFormat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('transaction ok', { creditCard: 123456789012345 });
