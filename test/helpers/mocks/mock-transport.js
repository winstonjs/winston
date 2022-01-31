const stream = require('stream')
const winston = require('../../../lib/winston');
const {Writable} = require("stream");
const {output} = require("./legacy-transport");

/**
 * Returns a new Winston transport instance which will invoke
 * the `write` method on each call to `.log`
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

/**
 * Returns a valid Winston transport that writes to the passed array object
 * @param array Array to be used to store the "written" chunks
 * @returns {winston.transports.Stream}
 */
function inMemory(array) {
  const memoryStream = new Writable({
    objectMode: true,
    write: (chunk, encoding, next) => {
      array.push(chunk);
      next()
    }
  });
  return new winston.transports.Stream({stream: memoryStream})
}

module.exports = {
  createMockTransport,
  inMemory
};
