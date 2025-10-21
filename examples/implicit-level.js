'use strict';

const winston = require('../');
const myCustomLevels = {
    l1: 0,
    l2:1,
    l3:2,
    l4:3,
    l5:4,
    l6:5,
    l7:6,
    l8:7
}

/* made customs levels and didn't specify level for cut off-
but here magic happens and default level is implicitly selected 
based on custom level using median approach*/

const myNewLogger = winston.createLogger({
   levels:myCustomLevels,
      transports: [
        new winston.transports.Console()
      ]
})

myNewLogger.l1("some l1 message");
myNewLogger.l2("some l2 message");
myNewLogger.l3("some l3 message");
myNewLogger.l4("some l4 message");
myNewLogger.l5("some l5 message");
myNewLogger.l6("some l6 message");



