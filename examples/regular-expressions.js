'use strict';

const winston = require('../');

console.info(new RegExp('a'));
// prints "/a/"

//
// TODO: THIS IS BROKEN & MUST BE FIXED BEFORE 3.0?
//
winston.info(new RegExp('a'));
// prints "info: /a/"
