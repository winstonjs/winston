
const { createLogger } = require('../');
const Transport = require('winston-transport');

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
class CustomTransport extends Transport {
  constructor(opts) {
    super(opts);

    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail,
    //   logentries, etc.).
    //
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Perform the writing to the remote service

    callback();
  }
};

const transport = new CustomTransport();
transport.on('logged', (info) => {
  // Verification that log was called on your transport
  console.log(`Logging! It's happening!`, info);
});

// Create a logger and consume an instance of your transport
const logger = createLogger({
  transports: [transport]
});

logger.info('hello')
