const stream = require('stream')
const winston = require('../../../lib/winston');

/**
 * Returns a new Winston transport instance which will invoke
 * the `write` method on each call to `.log`
 *
 * @param {function} write Write function for the specified stream
 * @returns {StreamTransportInstance} A transport instance
 */
function createMockTransport(write) {
  const writeable = new stream.Writable({
    objectMode: true,
    write: write
  });

  return new winston.transports.Stream({ stream: writeable })
}

module.exports = {
  createMockTransport
};
