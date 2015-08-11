var winston = require('../');
var LogStream = winston.LogStream;

//
// Writing a custom sanitizer to remove `creditCard`
//
var sanitize = winston.format(function (info, opts) {
  //
  // Right now this is impossible. Potentially very bad.
  //
  // this.last = info;

  if (opts.env === 'production') { delete info.creditCard; }
  return info;
})

var format = sanitize().pipe(winston.format.json());

//
// TODO: make functions like `winston.logger` that return
// instances of `winston.LogStream`
//
// var logger = winston.logger({
//   transports: [
//     winston.file({ format: format })
//     .pipe(winston.gzip())
//     .pipe(winston.fileRotate()),
//     winston.console({
//       format: format
//     })
//   ]
// })

var logger = new LogStream({
  format: format,
  level: 'info',
  transports: [
    //
    // Write to error and combined logs.
    //
    new winston.File({ file: 'error.log', level: 'error' }),
    new winston.File({ file: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.Console({
    format: winston.format.prettyPrint()
  }));
}
