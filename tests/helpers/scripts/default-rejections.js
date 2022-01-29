/*
 * default-rejectionss.js: A test fixture for logging rejections with the default winston logger.
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require("path"),
  winston = require("../../../lib/winston");

winston.rejections.handle([
  new winston.transports.File({
    filename: path.join(
      __dirname,
      "..",
      "..",
      "fixtures",
      "logs",
      "default-rejection.log"
    ),
    handleRejections: true
  })
]);

winston.info("Log something before error");

setTimeout(function() {
  Promise.reject(new Error("OH NOES! It rejected!"));
}, 1000);
