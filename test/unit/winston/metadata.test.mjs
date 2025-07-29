/* eslint-disable max-nested-callbacks */
import assume from 'assume';
import { createLogger, format } from '../../../lib/winston.js';
import { inMemory } from '../../helpers/mocks/mock-transport.js';

describe('Metadata Behavior', () => {
  let actualLogOutput;
  let logger;

  beforeEach(() => {
    actualLogOutput = [];
  });


  describe('Logger with default metadata', () => {
    beforeEach(() => {
      logger = createLogger({
        defaultMeta: { loggerName: 'parent' },
        transports: [inMemory(actualLogOutput)]
      });
    });

    describe('Metadata Precedence', () => {
      it('should include default metadata defined on the logger instance', () => {
        const expectedOutput = [
          { message: 'some message', level: 'info', loggerName: 'parent' }
        ];

        logger.info('some message');

        assume(expectedOutput).eqls(actualLogOutput);
      });

      it('should log specific metadata', () => {
        const expectedOutput = [
          { message: 'some message', level: 'info', loggerName: 'parent', logMeta: true }
        ];

        logger.info('some message', { logMeta: true });

        assume(expectedOutput).eqls(actualLogOutput);
      });

      it("should include both default metadata & log specific metadata if they don't conflict", () => {
        const expectedOutput = [
          { message: 'some message', level: 'info', loggerName: 'parent', logMeta: true }
        ];

        logger.info('some message', { logMeta: true });

        assume(expectedOutput).eqls(actualLogOutput);
      });

      it('should override default metadata with log specific metadata if they conflict', () => {
        const expectedOutput = [
          { message: 'some message', level: 'info', loggerName: 'some-cool-name' }
        ];

        logger.info('some message', { loggerName: 'some-cool-name' });

        assume(expectedOutput).eqls(actualLogOutput);
      });

      describe('Child logger instance', () => {
        let childLogger;

        it("should inherit the parent's default metadata", () => {
          const expectedOutput = [
            { message: 'some message', level: 'info', loggerName: 'parent' }, // parent logger
            { message: 'some message', level: 'info', loggerName: 'parent' } // child logger
          ];
          childLogger = logger.child();

          logger.info('some message');
          childLogger.info('some message');

          assume(expectedOutput).eqls(actualLogOutput);
        });

        it.skip("should not incur changes to the parent's metadata if it changes after the child is created", () => {
          const expectedOutput = [
            { message: 'some message', level: 'info', loggerName: 'parent' }, // child logger
            { message: 'some message', level: 'info', loggerName: 'parent' } // child logger
          ];
          childLogger = logger.child();

          childLogger.info('some message');
          logger.defaultMeta = {
            loggerName: 'parent-override'
          };
          childLogger.info('some message');

          assume(expectedOutput).eqls(actualLogOutput);
        });

        it("should include both the parent's & child's default metadata if they do not conflict", () => {
          const expectedOutput = [
            { message: 'some message', level: 'info', loggerName: 'parent' }, // parent logger
            { message: 'some message', level: 'info', loggerName: 'parent', isChild: true } // child logger
          ];
          childLogger = logger.child({ isChild: true });

          logger.info('some message');
          childLogger.info('some message');

          assume(expectedOutput).eqls(actualLogOutput);
        });

        it.skip("should allow overriding the parent's default metadata without affecting the parent", () => {
          const expectedOutput = [
            { message: 'some message', level: 'info', loggerName: 'child' }, // child logger
            { message: 'some message', level: 'info', loggerName: 'parent' } // parent logger
          ];
          childLogger = logger.child({ loggerName: 'child' });

          childLogger.info('some message');
          logger.info('some message');

          assume(expectedOutput).eqls(actualLogOutput);
        });


        it("should override the child's default metadata with the log specific metadata", () => {
          const expectedOutput = [
            { message: 'some message', level: 'info', loggerName: 'parent' }, // parent logger
            { message: 'some message', level: 'info', loggerName: 'parent', isChild: null } // child logger
          ];

          childLogger = logger.child({ isChild: true });

          logger.info('some message');
          childLogger.info('some message', { isChild: null });

          assume(expectedOutput).eqls(actualLogOutput);
        });

        it.skip("should override both the parent's & child's default metadata with the log specific metadata",
          () => {
            const expectedOutput = [
              { message: 'some message', level: 'info', loggerName: 'parent' }, // parent logger
              { message: 'some message', level: 'info', loggerName: 'child', isChild: null } // child logger
            ];

            childLogger = logger.child({ isChild: true });

            logger.info('some message');
            childLogger.info('some message', { loggerName: 'child', isChild: null });

            assume(expectedOutput).eqls(actualLogOutput);
          });
      });

      describe('Multiple child logger instances', () => {
        // FIXME: This test is skipped because child loggers default metadata will not override the parent's default metadata. aa
        it.skip("should have independent default metadata that overrides the parent's", () => {
          const expectedOutput = [
            { message: 'some message', level: 'info', loggerName: 'parent' }, // parent logger
            { message: 'some message', level: 'info', loggerName: 'child1' }, // child1 logger
            { message: 'some message', level: 'info', loggerName: 'child1-override' }, // child1 logger override
            { message: 'some message', level: 'info', loggerName: 'child2' }, // child2 logger
            { message: 'some message', level: 'info', loggerName: 'child2-override' }, // child2 logger override
            { message: 'some message', level: 'info', loggerName: 'child3' }, // child3 logger
            { message: 'some message', level: 'info', loggerName: 'child3-override' }, // child3 logger override
            { message: 'some message', level: 'info', loggerName: 'parent' } // parent logger
          ];

          const childLogger1 = logger.child({ loggerName: 'child1' });
          const childLogger2 = logger.child({ loggerName: 'child2' });
          const childLogger3 = logger.child({ loggerName: 'child3' });

          logger.info('some message');
          childLogger1.info('some message');
          childLogger1.info('some message', { loggerName: 'child1-override' });
          childLogger2.info('some message');
          childLogger2.info('some message', { loggerName: 'child2-override' });
          childLogger3.info('some message');
          childLogger3.info('some message', { loggerName: 'child3-override' });
          logger.info('some message');


          assume(expectedOutput).eqls(actualLogOutput);
        });
      });
    });
  });

  describe('Metadata application with formats', () => {
    describe('Printf Format', () => {
      beforeEach(() => {
        logger = createLogger({
          defaultMeta: { loggerName: 'parent' },
          format: format.combine(
            format.printf(
              info => `[${info.loggerName}] [${info.level}]: ${info.message}`
            )
          ),
          transports: [inMemory(actualLogOutput)]
        });
      });

      it('should allow inclusion of default metadata in format', () => {
        const expectedOutput = [
          { message: 'some message', level: 'info', loggerName: 'parent', [Symbol.for('message')]: '[parent] [info]: some message' }
        ];

        logger.info('some message');

        assume(expectedOutput).eqls(actualLogOutput);
      });
    });
  });
});
