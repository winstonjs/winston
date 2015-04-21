var winston = require('../');

console.info(new RegExp('a'));
// prints "/a/"

winston.info(new RegExp('a'));
// prints "info: /a/"