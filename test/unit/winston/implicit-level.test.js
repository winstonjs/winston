const {createLogger} = require("../../../lib/winston");

describe('createLogger() with custom levels and level should be calculated implicitly', () => {

  test('should default to low level if level not specified', () => {
    const customLevels = { low: 0, medium: 1, high: 2 };
    
    const logger = createLogger({ levels: customLevels });

    // logger.level should be the median (medium) / calculated implicitly
    expect(logger.level).toBe('low');
  });

  test('should default to fourth level if level not specified', () => {
    const customLevels = { first: 0, second: 1, third: 2 , fourth :4,fifth:5 ,sixth:6 , seventh:7,eight:8};
    
    const logger = createLogger({levels: customLevels});

    // logger.level should be the median (medium) / calculated implicitly
    expect(logger.level).toBe('fourth');
  });

  test('should default to info level if level not specified and levels not specified', () => {
    
    const logger = createLogger();

    // logger.level should be the median (medium) / calculated implicitly
    expect(logger.level).toBe('info');
  });

});
