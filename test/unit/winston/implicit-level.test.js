const { levels } = require("logform");
const {createLogger, level} = require("../../../lib/winston");

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
  test('Should default to second level if level  specified', () => {
    const customLevels = { first: 0, second: 1, third: 2 , fourth :4,fifth:5 ,sixth:6 , seventh:7,eight:8};
    
    const logger = createLogger({levels: customLevels,level:"fourth"});

    // logger.level should be the median (medium) / calculated implicitly
    expect(logger.level).toBe('fourth');
  });

  test('should default to info level if level not specified and levels not specified', () => {
    
    const logger = createLogger();

    // logger.level should be the median (medium) / calculated implicitly
    expect(logger.level).toBe('info');
  });

  test('should default to firstLevel when   levels  specified', () => {
    
    const logger = createLogger({levels:{
      firstLevel:0
    }});

    // logger.level should be the median (medium) / calculated implicitly
    expect(logger.level).toBe('firstLevel');
  });
  test('should default to firstLevel when   levels  specified', () => {
    
    const logger = createLogger({levels:{
      firstLevel:0,
      secondLevel:1,
    }});

    // logger.level should be the median (medium) / calculated implicitly
    expect(logger.level).toBe('firstLevel');
  });

});
