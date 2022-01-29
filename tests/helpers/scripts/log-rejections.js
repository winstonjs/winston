/*
 * log-rejections.js: A test fixture for logging rejections in winston.
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require("path"),
  winston = require("../../../lib/winston");

var logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(
        __dirname,
        "..",
        "..",
        "fixtures",
        "logs",
        "rejections.log"
      ),
      handleRejections: true
    })
  ]
});

logger.rejections.handle();

setTimeout(function() {
  Promise.reject(new Error("OH NOES! It rejected!"));
}, 1000);
