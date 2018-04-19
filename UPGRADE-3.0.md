# Upgrading to `winston@3.0.0`

> This document is a **work in progress.** Having trouble upgrading to 
> `winston@3.0.0-rc{X}`? Open an issue so we can improve this guide! 

- [Breaking changes]
   - [Top-level `winston.*` API]
   - [Transports]
   - [`winston.Container` and `winston.loggers`]
   - [`winston.Logger`]
   - [Exceptions & exception handling]
   - [Other minor breaking changes]
- [Upgrading to `winston.format`]
   - [Removed `winston.Logger` formatting options]
   - [Removed `winston.transports.{File,Console,Http}` formatting options]
   - [Migrating `formatters` and `rewriters` to `formats` in `winston@3`]
- [Modularity: `winston-transport`, `logform` and more]

## Breaking changes

### Top-level `winston.*` API
- `winston.Logger` has been replaced with `winston.createLogger`.
- `winston.setLevels` has been removed. Levels are frozen at the time of Logger creation.
- Setting the level on the default `winston` logger no longer sets the level on the transports associated with the default `winston` logger.

### Transports
- `winston.transports.Memory` was removed. Use any Node.js `stream.Writeable` with a large `highWaterMark` instance instead.
- When writing transports use `winston-transport` instead of `winston.Transport`

### `winston.Container` and `winston.loggers`
- `winston.Container` instances no longer have default `Console` transports
- `winston.Container.prototype.add` no longer does crazy options parsing. Implementation inspired by [segmentio/winston-logger](https://github.com/segmentio/winston-logger/blob/master/lib/index.js#L20-L43)

### `winston.Logger`
- `winston.Logger` will no longer respond with an error when logging with no transports
- `winston.Logger` will no longer respond with an error if the same transports are added twice.
- `Logger.prototype.stream`
  - `options.transport` is removed. Use the transport instance on the logger directly.
- `Logger.prototype.query`
  - `options.transport` is removed. Use the transport instance on the logger directly.

### Exceptions & exception handling
- `winston.exception` has been removed. Use:
``` js
const exception = winston.ExceptionHandler();
```
- `humanReadableUnhandledException` is now the default exception format.
- `.unhandleExceptions()` will no longer modify transports state, merely just add / remove the `process.on('uncaughtException')` handler.
  - Call close on any explicit `ExceptionHandlers`.
  - Set `handleExceptions = false` on all transports.

### Other minor breaking changes
- `winston.hash` was removed.
- `winston.common.pad` was removed.
- `winston.common.serialized` was removed (use `winston-compat`).
- `winston.common.log` was removed (use `winston-compat`).

## Upgrading to `winston.format`

The biggest issue with `winston@2` and previous major releases was that any new formatting options required changes to `winston` itself. All formatting is now handled by **formats**. 

Custom formats can now be created with no changes to `winston` core. _We encourage you to consider a custom format before opening an issue._

### Removed `winston.Logger` formatting options
- The default output format is now `formats.json()`.
- `filters`: Use a custom `format`. See: [Formatters and Rewriters] below.
- `rewriters`: Use a custom `format`. See: [Formatters and Rewriters] below.

### Removed `winston.transports.{File,Console,Http}` formatting options
- `stringify`: Use a [custom format].
- `formatter`: Use a [custom format].
- `json`: Use `formats.json()`.
- `raw`: Use `formats.json()`.
- `prettyPrint`: Use `formats.prettyPrint()` or a [custom format].
- `colorize`: Use `formats.colorize()`.
- `timestamp`: Use `formats.timestamp()`.
- `logstash`: Use `formats.logstash()`.
- `align`: Use `formats.align()`.
- `showLevel`: Use a [custom format].

### Migrating `formatters` and `rewriters` to `formats` in `winston@3`

In `winston@3.x.x` `info` objects are considered mutable. The API _combined
formatters and rewriters into a single, new concept:_ **formats**. 

#### Filters

If you are looking to upgrade your `filter` behavior please read on. In 
`winston@2.x` this **filter** behavior:

``` js
const isSecret = /super secret/;
const logger = new winston.Logger(options);
logger.filters.push(function(level, msg, meta) {
  return msg.replace(isSecret, 'su*** se****');
});

// Outputs: {"level":"error","message":"Public error to share"}
logger.error('Public error to share');

// Outputs: {"level":"error","message":"This is su*** se**** - hide it."}
logger.error('This is super secret - hide it.');
```

Can be modeled as a **custom format** that you combine with other formats:

``` js
const { createLogger, format, transports } = require('winston');

// Ignore log messages if the have { private: true }
const isSecret = /super secret/;
const filterSecret = format((info, opts) => {
  info.message = info.message.replace(isSecret, 'su*** se****');
  return info;
});

const logger = createLogger({
  format: format.combine(
    filterSecret(),
    format.json()
  ),
  transports: [new transports.Console()]
});

// Outputs: {"level":"error","message":"Public error to share"}
logger.log({
  level: 'error',
  message: 'Public error to share'
});

// Outputs: {"level":"error","message":"This is su*** se**** - hide it."}
logger.log({
  level: 'error',
  message: 'This is super secret - hide it.'
});
```

#### Rewriters

If you are looking to upgrade your `rewriter` behavior please read on. In 
`winston@2.x` this **rewriter** behavior:

``` js
const logger = new winston.Logger(options);
logger.rewriters.push(function(level, msg, meta) {
  if (meta.creditCard) {
    meta.creditCard = maskCardNumbers(meta.creditCard)
  }

  return meta;
});

logger.info('transaction ok', { creditCard: 123456789012345 });
```

Can be modeled as a **custom format** that you combine with other formats:

``` js 
const maskFormat = winston.format(info => {
  // You can CHANGE existing property values
  if (info.creditCard) {
    info.creditCard = maskCardNumbers(info.creditCard);
  }

  // You can also ADD NEW properties if you wish
  info.hasCreditCard = !!info.creditCard;

  return info;
});

const logger = winston.createLogger({
  format: winston.formats.combine(
    maskFormat(),
    winston.formats.json()
  )
});

logger.info('transaction ok', { creditCard: 123456789012345 });
```

See [examples/format-mutate.js](/examples/format-mutate.js) for a complete end-to-end example that covers both filtering and rewriting behavior in `winston@2.x`.

## Modularity: `winston-transport`, `logform` and more

As of `winston@3.0.0` the project has been broken out into a few modules:

- [winston-transport]: `Transport` stream implementation & legacy `Transport` wrapper.
- [logform]: All formats exports through `winston.format` 
- `LEVEL` and `MESSAGE` symbols exposed through [triple-beam].
- [Shared test suite][abstract-winston-transport] for community transports 

Let's dig in deeper. The example below has been annotated to demonstrate the different packages that compose the example itself:

``` js
const { createLogger, transports, format } = require('winston');
const Transport = require('winston-transport');
const logform = require('logform');
const { combine, timestamp, label, printf } = logform.format;

// winston.format is require('logform')
console.log(logform.format === format) // true

const logger = createLogger({
  format: combine(
    label({ label: 'right meow!' }),
    timestamp(),
    printf(nfo => {
      return `${nfo.timestamp} [${nfo.label}] ${nfo.level}: ${nfo.message}`;
    })
  ),
  transports: [new transports.Console()]
});
```

[winston-transport]: https://github.com/winstonjs/winston-transport
[logform]: https://github.com/winstonjs/logform
[triple-beam]: https://github.com/winstonjs/triple-beam
[abstract-winston-transport]: https://github.com/winstonjs/abstract-winston-transport

[custom-format]: /README.md#creating-custom-formats
