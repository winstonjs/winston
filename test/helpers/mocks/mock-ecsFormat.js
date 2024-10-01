const winston = require('../../../lib/winston');
const { MESSAGE } = require('triple-beam');

/**
 * Create a mock Winston format for ecs-logging output.
 *
 * @param {object} info object to be transformed
 * @returns {object} object with ecs format
 */
function ecsTransform(info) {
  const reservedFields = {
    level: true,
    'log.level': true,
    ecs: true,
    '@timestamp': true,
    err: true,
    req: true,
    res: true
  };

  const ecsFields = {
    '@timestamp': new Date().toISOString(),
    'log.level': info.level,
    message: info.message,
    ecs: { "version":"1.6.0" }
  };

  const keys = Object.keys(info);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (!reservedFields[key]) {
      ecsFields[key] = info[key];
    }
  }

  const mockStringify = function(ecsFields) {
    let serviceObject; 

    if (typeof ecsFields.service === 'string'){
      for (let i=0; i <= ecsFields.service.length; i++){
        serviceObject[`${i}`] = ecsFields.service[i];
      }
    } else {
      serviceObject = ecsFields.service;
    }

    const serviceString = JSON.stringify(serviceObject);
    const ecsVersionString = JSON.stringify(ecsFields.ecs);

    return `{"@timestamp":"${ecsFields['@timestamp']}","log.level":${ecsFields['log.level']}","ecs":${ecsVersionString},"service":${serviceString}}`;
  }

  info[MESSAGE] = mockStringify(ecsFields);
  return info;
}

module.exports = winston.format(ecsTransform);
