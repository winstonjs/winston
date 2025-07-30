import assume from 'assume';
import { createLogger } from '../../../lib/winston.js';
import { inMemory } from '../../helpers/mocks/mock-transport.js';


class SuperError extends Error {
  constructor() {
    super();
    Object.defineProperty(this, 'canBeAnything', { enumerable: true, value: '' });
  }
}

class ThisError extends SuperError {
  message;

  constructor() {
    super();
    this.message = 'This must not be empty';
  }
}

describe.skip('[TODO] Regressions reported in v3.7.x', () => {
  let logger;
  let actualLogOutput;

  beforeEach(() => {
    actualLogOutput = [];
    logger = createLogger({
      defaultMeta: { loggerName: 'parent' },
      transports: [inMemory(actualLogOutput)]
    });
  });

  describe('Logging of Errors', () => {
    it('should not throw an error when logging an instance of a class that extends Error', () => {
      const error = new ThisError();
      const expectedOutput = [
        { level: 'error', message: 'This must not be empty', stack: error.stack, loggerName: 'parent' }
      ];

      logger.info(new ThisError());

      assume(expectedOutput).eqls(actualLogOutput);
    });

    it('should handle plain Error instances correctly', () => {
      const error = new Error('dummy error');
      const expectedOutput = [
        { level: 'error', message: 'dummy error', stack: error.stack, service: 'user-service' }
      ];

      logger.error(error);

      assume(expectedOutput).eqls(actualLogOutput);
    });
  });
});
