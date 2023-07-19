const assume = require('assume');
const winston = require('../../lib/winston');

const Logger = winston.Logger;

describe('Logger class', () => {
  it('that Logger class is exported', () => {
    Logger === require('../../lib/winston/logger');
  });

  it('can be inherited', () => {
    class CustomLogger extends Logger {}
    const instance = new CustomLogger();
    assume(instance).instanceOf(CustomLogger);
    assume(instance).instanceOf(Logger);
  });
});
