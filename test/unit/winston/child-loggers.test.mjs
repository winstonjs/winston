'use strict';

import assume from 'assume';
import { createLogger } from '../../../lib/winston.js';
import { inMemory } from '../../helpers/mocks/mock-transport.js';

describe('Child Loggers', () => {
  let actualLogOutput;
  let logger;
  let childLogger;

  beforeEach(() => {
    actualLogOutput = [];
    logger = createLogger({ transports: [inMemory(actualLogOutput)] });
    childLogger = logger.child({ service: 'user-service' });
  });

  it('handles error stack traces in child loggers correctly', () => {
    const error = new Error('dummy error');
    const expectedOutput = [
      { level: 'error', message: 'dummy error', stack: error.stack, service: 'user-service' }
    ];

    childLogger.error(error);

    assume(expectedOutput).eqls(actualLogOutput);
  });
});
