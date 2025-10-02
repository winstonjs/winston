const winston = require('../../../../lib/winston');
const assume = require('assume');

// https://github.com/winstonjs/winston/issues/1364
describe('transports issue 1364', () => {
  const mainError = 'Error logging!';
  const otherError = 'Other error';
  let logger;
  let errorMessage;
  let counter;
  let maxCounter;
  let logError;
  let transport;
  const newTransport = () =>
    Object.assign(new winston.transports.Console(), {
      log: (info, next) => {
        if (counter === maxCounter) {
          next(new Error(errorMessage));
          return;
        }
        if (logError !== null) {
          errorMessage = otherError;
        }
        counter = counter + 1;
        next();
        return;
      }
    });
  beforeEach(() => {
    errorMessage = mainError;
    counter = 0;
    maxCounter = 1;
    logError = null;
    transport = newTransport();
    logger = winston.createLogger({
      level: 'info',
      transports: [transport]
    });
    logger.on('error', error => {
      counter = 0;
      logError = error;
    });
  });

  describe('only log once', () => {
    beforeEach(() => {
      logger.info('log once');
    });

    it('logger transport has single correct transport', () => {
      const transports = logger.transports;
      assume(transports).is.an('array');
      assume(transports).length(1);
      assume(transports).contains(transport);
    });

    it("error didn't", () => {
      assume(logError).not.exists();
    });
  });

  describe('log twice', () => {

    it('should check transport after error occurs', (done) => {
      errorMessage = mainError;
      counter = 0;
      maxCounter = 1;
      logError = null;
      transport = newTransport();
      logger = winston.createLogger({
        level: 'info',
        transports: [transport]
      });
      logger.on('error', error => {
        assume(counter).equals(1); // count calls to `log`
        assume(error).is.a('error');
        assume(error).property('message', mainError);
        done(); // should be called only once
      });
      logger.info('log twice 1');
      logger.info('log twice 2'); // this raises the `mainError` for the transport
      const transports = logger.transports;
      assume(transports).is.an('array');
      assume(transports).length(1);
      assume(transports).contains(transport);
    });
  });

  describe('log thrice', () => {

    it('logger transport has single correct transport', (done) => {
      errorMessage = mainError;
      counter = 0;
      maxCounter = 1;
      logError = null;
      transport = newTransport();
      logger = winston.createLogger({
        level: 'info',
        transports: [transport]
      });
      logger.on('error', error => {
        assume(error).is.a('error');
        assume(error).property('message', mainError);
        done();
      });
      logger.info('log thrice 1');
      logger.info('log thrice 2'); // this raises the `mainError` for the transport
      logger.info('log thrice 3');
      const transports = logger.transports;
      assume(transports).is.an('array');
      assume(transports).length(1);
      assume(transports).contains(transport);
    });
  });

  describe('log four times', () => {

    it('logger transport has single correct transport', (done) => {
      errorMessage = mainError;
      counter = 0;
      maxCounter = 1;
      logError = null;
      transport = newTransport();
      logger = winston.createLogger({
        level: 'info',
        transports: [transport]
      });
      logger.on('error', error => {
        assume(error).is.a('error');
        assume(error).property('message', counter === 1 ? mainError : otherError);
        done();
      });
      logger.info('log four times 1');
      logger.info('log four times 2'); // this raises the `mainError` for the transport
      logger.info('log four times 3');
      logger.info('log four times 4'); // this raises the `otherError` for the transport
      const transports = logger.transports;
      assume(transports).is.an('array');
      assume(transports).length(1);
      assume(transports).contains(transport);
    });
  });
});
