# winston

A logger for just about everything.

[![Version npm](https://img.shields.io/npm/v/winston.svg?style=flat-square)](https://www.npmjs.com/package/winston)[![npm Downloads](https://img.shields.io/npm/dm/winston.svg?style=flat-square)](https://www.npmjs.com/package/winston)[![Build Status](https://img.shields.io/travis/winstonjs/winston/master.svg?style=flat-square)](https://travis-ci.org/winstonjs/winston)[![Dependencies](https://img.shields.io/david/winstonjs/winston.svg?style=flat-square)](https://david-dm.org/winstonjs/winston)

[![NPM](https://nodei.co/npm/winston.png?downloads=true&downloadRank=true)](https://nodei.co/npm/winston/)

[![Join the chat at https://gitter.im/winstonjs/winston](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/winstonjs/winston?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## winston@3.0.0-rc0

We are looking for feedback on the latest version of `winston`:
`winston@3.0.0-rc0`.

```
npm i winston@next --save
```

See the [Upgrade Guide](UPGRADE-3.0.md) for more information. Bug reports and
PRs welcome!

## Motivation

`winston` is designed to be a simple and universal logging library with
support for multiple transports. A transport is essentially a storage device
for your logs. Each `winston` logger can have multiple transports (see:
[Transports]) configured at different levels (see: [Logging levels]). For
example, one may want error logs to be stored in a persistent remote location
(like a database), but all logs output to the console or a local file.

`winston` aims to decouple parts of the logging process to make it more
flexible and extensible. Attention is given to supporting flexibility in log
formatting (see: [Formats]) & levels (see: [Using custom logging levels]), and
ensuring those APIs decoupled from the implementation of transport logging
(i.e. how the logs are stored / indexed, see: [Adding Custom Transports]) to
the API that they exposed to the programmer.

## Usage

The recommended way to use `winston` is to create your own logger. The
simplest way to do this is using `winston.createLogger`:

``` js
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

You may also log directly via the default logger exposed by
`require('winston')`, but this merely intended to be a convenient shared
logger to use throughout your application if you so choose.

## Table of contents

* [Logging](#logging)
  * [Creating your logger](#creating-your-own-logger)
  * [Streams, `objectMode`, and info` objects](#streams-objectmode-and-info-objects)
* [Formats]
  * [Combining formats](#combining-formats)
  * [String interpolation](#string-interpolation)
  * [Filtering `info` Objects](#filtering-info-objects)
  * [Creating custom formats](#creating-custom-formats)
* [Logging levels]
  * [Using logging levels](#using-logging-levels)
  * [Using custom logging levels](#using-custom-logging-levels)
* [Transports]
  * [Multiple transports of the same type](#multiple-transports-of-the-same-type)
  * [Adding Custom Transports](#adding-custom-transports)
* [Exceptions](#exceptions)
  * [Handling Uncaught Exceptions with winston](#handling-uncaught-exceptions-with-winston)
  * [To Exit or Not to Exit](#to-exit-or-not-to-exit)
* [Profiling](#profiling)
* [Streaming Logs](#streaming-logs)
* [Querying Logs](#querying-logs)
* [Further Reading](#further-reading)
  * [Using the default logger](#using-the-default-logger)
  * [Events and Callbacks in `winston`](#events-and-callbacks-in-winston)
  * [Working with multiple Loggers in winston](#working-with-multiple-loggers-in-winston)
* [Installation](#installation)
* [Run Tests](#run-tests)

## Logging

Logging levels in `winston` conform to the severity ordering specified by
[RFC5424]: _severity of all levels is assumed to be numerically **ascending**
from most important to least important._

``` js
const levels = { 
  error: 0, 
  warn: 1, 
  info: 2, 
  verbose: 3, 
  debug: 4, 
  silly: 5 
}
```

### Creating your own Logger
You get started by creating a logger using `winston.createLogger`:

``` js
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

A logger accepts a following parameters:

| Name          | Default                |  Description    |
| ------------- | ---------------------- | --------------- |
| `level`       | `'info'`               | Log only if `info.level` less than or equal to this level  |  
| `levels`      | `winston.config.npm`   | Levels (and colors) representing log priorities            |
| `format`      | `winston.formats.json` | Formatting for `info` messages  (see: [Formats])           |
| `transports`  | `[]` _(No transports)_ | Set of logging targets for `info` messages                 |
| `exitOnError` | `true`                 | If false, handled exceptions will not cause `process.exit` |

The levels provided to `createLogger` will be defined as convenience methods
on the `logger` returned. 

``` js
//
// Logging
//
logger.log({
  level: 'info'
  message: 'Hello distributed log files!'
});

logger.info('Hello again distributed logs');
```

You can add or remove transports from the `logger` once it has been provided 
to you from `winston.createLogger`:

``` js
const files = new winston.transports.File({ filename: 'combined.log' });
const console = new winston.transports.Console();

logger
  .clear()          // Remove all transports
  .add(console)     // Add console transport
  .add(files)       // Add file transport
  .remove(console); // Remove console transport
```

You can also wholesale reconfigure a `winston.Logger` instance using the
`configure` method:

``` js
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

//
// Replaces the previous transports with those in the
// new configuration wholesale.
//
const DailyRotateFile = require('winston-daily-rotate-file');
logger.configure({
  level: 'verbose',
  transports: [
    new DailyRotateFile(opts)
  ]
});
```

### Streams, `objectMode`, and info` objects

In `winston`, both `Logger` and `Transport` instances are treated as
`objectMode` streams that accept an `info` object. The `info`
object represents a single log message. The object itself is mutable. Every
`info` must have at least the `level` and `message` properties:

``` js
{
  level: 'info',                 // Level of the logging message  
  message: 'Hey! Log something?' // Descriptive message being logged.
}
```

`winston.format` itself exposes several additional properties:

- `splat`: string interpolation splat for `%d %s`-style messages.
- `timestamp`: timestamp the message was received.
- `label`: custom label associated with each message.

As a consumer you may add whatever properties you wish – _internal state is
maintained by `Symbol` properties:_

- `Symbol.for('level')` _**(READ-ONLY)**:_ equal to `level` property. Is 
treated as immutable by all code.  
- `Symbol.for('message'):` complete string message set by "finalizing 
formats": `json`, `logstash`, `printf`, `prettyPrint`, and `simple`. 

## Formats

Formats in `winston` can be accessed from `winston.format`. They are
implemented in, `logform`, a separate module from `winston`. This allows
flexibility when writing your own transports in case you wish to include a
default format with your transport.

In modern versions of `node` template strings are very performant and are the recommended way for doing most end-user formatting. If you want to bespoke format your logs, `winston.format.printf` is for you:

``` js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: 'right meow!' }),
    timestamp(),
    myFormat
  ),
  transports: [new transports.Console()]
});
```

### Combining formats

Any number of formats may be combined into a single format using
`format.combine`. Since `format.combine` takes no `opts`, as a convenience it
returns pre-created instance of the combined format.

``` js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
  format: combine(
    label({ label: 'right meow!' }),
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.Console()]
})

logger.log({
  level: 'info',
  message: 'What time is the testing at?'
});
// Outputs:
// { level: 'info',
//   message: 'What time is the testing at?',
//   label: 'right meow!',
//   timestamp: '2017-09-30T03:57:26.875Z' }
```

### String interpolation

The `log` method provides the string interpolation using [util.format]. **It
must be enabled using `format.splat`.**

Below is an example that defines a format with string interpolation of
messages using `format.splat` and then serializes the entire `info` message
using `format.simple`.

``` js
const { createLogger, format, transports } = require('winston');
const logger = createLogger({
  format: format.combine(
    format.splat(),
    format.simple()
  ),
  transports: [new transports.Console()]
});

// info: test message my string {}
logger.log('info', 'test message %s', 'my string');

// info: test message my 123 {}
logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });
```

### Filtering `info` Objects

If you wish to filter out a given `info` Object completely when logging then 
simply return a falsey value.

``` js
const { createLogger, format, transports } = require('winston');

// Ignore log messages if the have { private: true }
const ignorePrivate = format((info, opts) => {
  if (info.private) { return false; }
  return info;
});

const logger = createLogger({
  format: format.combine(
    ignorePrivate(),
    format.json()
  ),
  transports: [new transports.Console()]
});

// Outputs: {"level":"error","message":"Public error to share"}
logger.log({
  level: 'error',
  message: 'Public error to share'
});

// Messages with { private: true } will not be written when logged.
logger.log({
  private: true,
  level: 'error',
  message: 'This is super secret - hide it.'
});
```

Use of `format.combine` will respect any falsey values return and stop
evaluation of later formats in the series. For example:

``` js
const { format } = require('winston');
const { combine, timestamp, label } = format;

const willNeverThrow = format.combine(
  format(info => { return false })(), // Ignores everything
  format(info => { throw new Error('Never reached') })()
);
```

### Creating custom formats

Formats are prototypal objects (i.e. class instances) that define a single 
method: `transform(info, opts)` and return the mutated `info`:

- `info`: an object representing the log message.
- `opts`: setting specific to the current instance of the format.

They are expected to return one of two things:

- **An `info` Object** representing the modified `info` argument. Object 
references need not be preserved if immutability is preferred. All current 
built-in formats consider `info` mutable, but [immutablejs] is being 
considered for future releases.
- **A falsey value** indicating that the `info` argument should be ignored by the 
caller. (See: [Filtering `info` Objects](#filtering-info-objects)) below.

`winston.format` is designed to be as simple as possible. To define a new
format simple pass it a `transform(info, opts)` function to get a new
`Format`.

The named `Format` returned can be used to create as many copies of the given
`Format` as desired:

``` js
const { format } = require('winston');

const volume = format((info, opts) => {
  if (opts.yell) {
    info.message = info.message.toUpperCase();
  } else if (opts.whisper) {
    info.message = info.message.toLowerCase();
  }

  return info;
});

// `volume` is now a function that returns instances of the format.
const scream = volume({ yell: true });
console.dir(scream.transform({
  level: 'info',
  message: `sorry for making you YELL in your head!`
}, scream.options));
// {
//   level: 'info'
//   message: 'SORRY FOR MAKING YOU YELL IN YOUR HEAD!'
// }

// `volume` can be used multiple times to create different formats.
const whisper = volume({ whisper: true });
console.dir(whisper.transform({
  level: 'info',
  message: `WHY ARE THEY MAKING US YELL SO MUCH!`
}), whisper.options);
// {
//   level: 'info'
//   message: 'why are they making us yell so much!'
// }
```

## Logging Levels

Logging levels in `winston` conform to the severity ordering specified by
[RFC5424]: _severity of all levels is assumed to be numerically **ascending**
from most important to least important._

Each `level` is given a specific integer priority. The higher the priority the
more important the message is considered to be, and the lower the
corresponding integer priority.  For example, as specified exactly in RFC5424
the `syslog` levels are prioritized from 0 to 7 (highest to lowest).

```js
{ 
  emerg: 0, 
  alert: 1, 
  crit: 2, 
  error: 3, 
  warning: 4, 
  notice: 5, 
  info: 6, 
  debug: 7
}
```

Similarly, `npm` logging levels are prioritized from 0 to 5 (highest to
lowest):

``` js
{ 
  error: 0, 
  warn: 1, 
  info: 2, 
  verbose: 3, 
  debug: 4, 
  silly: 5 
}
```

If you do not explicitly define the levels that `winston` should use the
`npm` levels above will be used.

### Using Logging Levels

Setting the level for your logging message can be accomplished in one of two
ways. You can pass a string representing the logging level to the log() method
or use the level specified methods defined on every winston Logger.

``` js
//
// Any logger instance
//
logger.log('silly', "127.0.0.1 - there's no place like home");
logger.log('debug', "127.0.0.1 - there's no place like home");
logger.log('verbose', "127.0.0.1 - there's no place like home");
logger.log('info', "127.0.0.1 - there's no place like home");
logger.log('warn', "127.0.0.1 - there's no place like home");
logger.log('error', "127.0.0.1 - there's no place like home");
logger.info("127.0.0.1 - there's no place like home");
logger.warn("127.0.0.1 - there's no place like home");
logger.error("127.0.0.1 - there's no place like home");

//
// Default logger
//
winston.log('info', "127.0.0.1 - there's no place like home");
winston.info("127.0.0.1 - there's no place like home");
```

`winston` allows you to define a `level` property on each transport which
specifies the **maximum** level of messages that a transport should log. For
example, using the `syslog` levels you could log only `error` messages to the
console and everything `info` and below to a file (which includes `error`
messages):

``` js
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({ level: 'error' }),
    new winston.transports.File({
      filename: 'combined.log',
      level: 'info'
    })
  ]
});
```

You may also dynamically change the log level of a transport:

``` js
const transports = {
  console: new winston.transports.Console({ level: 'warn': level: 'warn' }),
  file: new winston.transports.File({ filename: 'combined.log', level: 'error' })
};

const logger = winston.createLogger({
  transports: [
    transports.console,
    transports.file
  ]
});

logger.info('Will not be logged in either transport!');
transports.console.level = 'info';
transports.file.level = 'info';
logger.info('Will be logged in both transports!');
```

`winston` supports customizable logging levels, defaulting to npm style
logging levels. Levels must be specified at the time of creating your logger.

### Using Custom Logging Levels

In addition to the predefined `npm`, `syslog`, and `cli` levels available in
`winston`, you can also choose to define your own:

``` js
const myCustomLevels = {
  levels: {
    foo: 0,
    bar: 1,
    baz: 2,
    foobar: 3
  },
  colors: {
    foo: 'blue',
    bar: 'green',
    baz: 'yellow',
    foobar: 'red'
  }
};

const customLevelLogger = winston.createLogger({ 
  levels: myCustomLevels.levels 
});

customLevelLogger.foobar('some foobar level-ed message');
```

Although there is slight repetition in this data structure, it enables simple
encapsulation if you do not want to have colors. If you do wish to have
colors, in addition to passing the levels to the Logger itself, you must make
winston aware of them:

``` js
winston.addColors(myCustomLevels);
```

This enables transports with the 'colorize' option set to appropriately color
the output of custom levels.

## Transports

There are several [core transports] included in  `winston`, which leverage the
built-in networking and file I/O offered by Node.js core. In addition, there
are [additional transports] written by members of the community.

## Multiple transports of the same type

It is possible to use multiple transports of the same type e.g.
`winston.transports.File` when you construct the transport.

``` js
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'combined.log',
      level: 'info'
    }),
    new winston.transports.File({
      filename: 'errors.log',
      level: 'error'
    })
  ]
});
```

If you later want to remove one of these transports you can do so by using the
transport itself. e.g.:

``` js
const combinedLogs = logger.transports.find(transport => {
  return transport.filename === 'combined.log'
});

logger.remove(combinedLogs);
```

## Adding Custom Transports

Adding a custom transport is easy. All you need to do is accept any options
you need, implement a log() method, and consume it with `winston`.

``` js
const Transport = require('winston-transport');
const util = require('util');

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
module.exports = class YourCustomTransport extends Transport {
  constructor(opts) {
    super(opts);
    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail, 
    //   logentries, etc.).
    //
  }

  log(info, callback) {
    setImmediate(function () {
      this.emit('logged', info);
    });

    // Perform the writing to the remote service
    callback();
  }
};
```

## Exceptions

### Handling Uncaught Exceptions with winston

With `winston`, it is possible to catch and log `uncaughtException` events
from your process. With your own logger instance you can enable this behavior
when it's created or later on in your applications lifecycle:

``` js
const { createLogger, transports } = require('winston');

// Enable exception handling when you create your logger.
const logger = winston.createLogger({
  transports: [
    new transports.File({ filename: 'combined.log' }) 
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'exceptions.log' })
  ]
});

// Or enable it later on by adding a transport or using `.exceptions.handle`
const logger = winston.createLogger({
  transports: [
    new transports.File({ filename: 'combined.log' }) 
  ]
});

// Call exceptions.handle with a transport to handle exceptions
logger.exceptions.handle(
  new transports.File({ filename: 'exceptions.log' })
);
```

If you want to use this feature with the default logger, simply call
`.exceptions.handle()` with a transport instance.

``` js
//
// You can add a separate exception logger by passing it to `.handleExceptions`
//
winston.exceptions.handle(
  new winston.transports.File({ filename: 'path/to/exceptions.log' })
);

//
// Alternatively you can set `.handleExceptions` to true when adding transports
// to winston. You can use the `.humanReadableUnhandledException` option to 
// get more readable exceptions.
//
winston.add(new winston.transports.File({
  filename: 'path/to/combined.log',
  handleExceptions: true
}));
```

### To Exit or Not to Exit

By default, winston will exit after logging an uncaughtException. If this is
not the behavior you want, set `exitOnError = false`

``` js
const logger = winston.createLogger({ exitOnError: false });

//
// or, like this:
//
logger.exitOnError = false;
```

When working with custom logger instances, you can pass in separate transports
to the `exceptionHandlers` property or set `handleExceptions` on any
transport.

##### Example 1

``` js
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'path/to/combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'path/to/exceptions.log' })
  ]
});
```

##### Example 2

``` js
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true
    })
  ],
  exitOnError: false
});
```

The `exitOnError` option can also be a function to prevent exit on only
certain types of errors:

``` js
function ignoreEpipe(err) {
  return err.code !== 'EPIPE';
}

const logger = winston.createLogger({ exitOnError: ignoreEpipe });

//
// or, like this:
//
logger.exitOnError = ignoreEpipe;
```

## Profiling

In addition to logging messages and metadata, `winston` also has a simple
profiling mechanism implemented for any logger:

``` js
//
// Start profile of 'test'
//
logger.profile('test');

setTimeout(function () {
  //
  // Stop profile of 'test'. Logging will now take place:
  //   '17 Jan 21:00:00 - info: test duration=1000ms'
  //
  logger.profile('test');
}, 1000);
```

Also you can start a timer and keep a reference that you can call `.done()``
on:

``` js
 // Returns an object corresponding to a specific timing. When done
 // is called the timer will finish and log the duration. e.g.:
 //
 const profiler = logger.startTimer();
 setTimeout(function () {
   profiler.done({ message: 'Logging message' });
 }, 1000);
```

All profile messages are set to 'info' level by default and both message and
metadata are optional. There are no plans in the Roadmap to make this
configurable, but we are open to suggestions through new issues!

## Querying Logs

`winston` supports querying of logs with Loggly-like options. [See Loggly
Search API](https://www.loggly.com/docs/api-retrieving-data/). Specifically:
`File`, `Couchdb`, `Redis`, `Loggly`, `Nssocket`, and `Http`.

``` js
const options = {
  from: new Date() - (24 * 60 * 60 * 1000),
  until: new Date(),
  limit: 10,
  start: 0,
  order: 'desc',
  fields: ['message']
};

//
// Find items logged between today and yesterday.
//
logger.query(options, function (err, results) {
  if (err) {
    /* TODO: handle me */
    throw err;
  }

  console.log(results);
});
```

## Streaming Logs
Streaming allows you to stream your logs back from your chosen transport.

``` js
//
// Start at the end.
//
winston.stream({ start: -1 }).on('log', function(log) {
  console.log(log);
});
```

## Further Reading

### Using the Default Logger

The default logger is accessible through the `winston` module directly. Any
method that you could call on an instance of a logger is available on the
default logger:

``` js
const winston = require('winston');

winston.log('info', 'Hello distributed log files!');
winston.info('Hello again distributed logs');

winston.level = 'debug';
winston.log('debug', 'Now my debug messages are written to console!');
```

By default, no transports are set on the default logger. You must
add or remove transports via the `add()` and `remove()` methods:

``` js
const files = new winston.transports.File({ filename: 'combined.log' });
const console = new winston.transports.Console();

winston.add(console);
winston.add(files);
winston.remove(console);
```

Or do it with one call to configure():

``` js
winston.configure({
  transports: [
    new winston.transports.File({ filename: 'somefile.log' })
  ]
});
```

For more documentation about working with each individual transport supported
by `winston` see the [`winston` Transports](docs/transports.md) document.

### Events and Callbacks in `winston`

Each instance of winston.Logger is also an instance of an [EventEmitter]. A
`logged` event will be raised each time a transport successfully logs a
message:

``` js
const transport = new winston.transports.Console();
const logger = winston.createLogger({
  transports: [transport];
});

transport.on('logged', function (info) {
  // `info` log message has now been logged
});

logger.info('CHILL WINSTON!', { seriously: true });
```

It is also worth mentioning that the logger also emits an 'error' event which
you should handle or suppress if you don't want unhandled exceptions:

``` js
//
// Handle errors
//
logger.on('error', function (err) { /* Do Something */ });

//
// Or just suppress them.
//
logger.emitErrs = false;
```

### Working with multiple Loggers in winston

Often in larger, more complex, applications it is necessary to have multiple
logger instances with different settings. Each logger is responsible for a
different feature area (or category). This is exposed in `winston` in two
ways: through `winston.loggers` and instances of `winston.Container`. In fact,
`winston.loggers` is just a predefined instance of `winston.Container`:

``` js
const winston = require('winston');

//
// Configure the logger for `category1`
//
winston.loggers.add('category1', {
  console: {
    level: 'silly',
    colorize: true,
    label: 'category one'
  },
  file: {
    filename: '/path/to/some/file'
  }
});

//
// Configure the logger for `category2`
//
winston.loggers.add('category2', {
  couchdb: {
    host: '127.0.0.1',
    port: 5984
  }
});
```

Now that your loggers are setup, you can require winston _in any file in your
application_ and access these pre-configured loggers:

``` js
const winston = require('winston');

//
// Grab your preconfigured logger
//
const category1 = winston.loggers.get('category1');

category1.info('logging from your IoC container-based logger');
```

If you prefer to manage the `Container` yourself, you can simply instantiate one:

``` js
const winston = require('winston');
const container = new winston.Container();

container.add('category1', {
  console: {
    level: 'silly',
    colorize: true
  },
  file: {
    filename: '/path/to/some/file'
  }
});
```

## Installation

``` bash
npm install winston
```

``` bash
yarn add winston
```

## Run Tests

All of the winston tests are written with `mocha`, `nyc`, and `assume`.  They
can be run with `npm`.

``` bash
npm test
```

#### Author: [Charlie Robbins]
#### Contributors: [Jarrett Cruger], [Alberto Pose]

[Transports]: #transports
[Logging levels]: #logging-levels
[Formats]: #formats
[Using custom logging levels]: #using-custom-logging-levels
[Adding Custom Transports]: #adding-custom-transports
[core transports]: docs/transports.md#winston-core
[additional transports]: docs/transports.md#additional-transports

[RFC5424]: https://tools.ietf.org/html/rfc5424
[EventEmitter]: https://nodejs.org/dist/latest/docs/api/events.html#events_class_eventemitter
[util.format]: https://nodejs.org/dist/latest/docs/api/util.html#util_util_format_format_args

[Charlie Robbins]: http://github.com/indexzero
[Jarrett Cruger]: https://github.com/jcrugzz
[Alberto Pose]: https://github.com/pose
