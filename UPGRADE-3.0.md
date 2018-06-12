# Upgrading to `winston@3.0.0`

> This document represents a **living guide** on upgrading to `winston@3`.
> Much attention has gone into the details, but if you are having trouble
> upgrading to `winston@3.0.0` **PLEASE** open an issue so we can improve this
> guide! 

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
   - [Migrating `filters` and `rewriters` to `formats` in `winston@3`]
- [Modularity: `winston-transport`, `logform` and more]

## Breaking changes

### Top-level `winston.*` API
- `winston.Logger` has been replaced with `winston.createLogger`.
- `winston.setLevels` has been removed. Levels are frozen at the time of Logger creation.
- Setting the level on the default `winston` logger no longer sets the level on the transports associated with the default `winston` logger.

### Transports
- `winston.transports.Memory` was removed. Use any Node.js `stream.Writeable` with a large `highWaterMark` instance instead.
- When writing transports use `winston-transport` instead of
  `winston.Transport`.
- Many formatting options that were previously configurable on transports 
  (e.g. `json`, `raw`, `colorize`, `prettyPrint`, `timestamp`, `logstash`, 
  `align`) should now be set by adding the appropriate formatter instead.
  _(See: "Removed `winston.transports.{File,Console,Http}` formatting options"
  below)_ 
- In `winston.transports.Console`, output for all log levels are now sent to stdout by default.
    - `stderrLevels` option now defaults to `[]`.
    - `debugStdout` option has been removed.

### `winston.Container` and `winston.loggers`
- `winston.Container` instances no longer have default `Console` transports
- `winston.Container.prototype.add` no longer does crazy options parsing. Implementation inspired by [segmentio/winston-logger](https://github.com/segmentio/winston-logger/blob/master/lib/index.js#L20-L43)

### `winston.Logger`
- **Do not use** `new winston.Logger(opts)` – it has been removed for
  improved performance. Use `winston.createLogger(opts)` instead.

- `winston.Logger.log` and level-specific methods (`.info`, `.error`, etc)
  **no longer accepts a callback.** The vast majority of use cases for this
  feature was folks awaiting _all logging_ to complete, not just a single
  logging message. To accomplish this:

``` js
logger.log('info', 'some message');
logger.on('finish', () => process.exit());
logger.end();
```

- `winston.Logger.add` no longer accepts prototypes / classes. Pass
  **an instance of our transport instead.**

``` js
// DON'T DO THIS. It will no longer work
logger.add(winston.transports.Console);

// Do this instead.
logger.add(new winston.transports.Console());
```

- `winston.Logger` will no longer do automatic splat interpolation by default.
  Be sure to use `formats.splat()` to enable this functionality.
- `winston.Logger` will no longer respond with an error when logging with no
  transports
- `winston.Logger` will no longer respond with an error if the same transports
  are added twice.
- `Logger.prototype.stream`
  - `options.transport` is removed. Use the transport instance on the logger
    directly.
- `Logger.prototype.query`
  - `options.transport` is removed. Use the transport instance on the logger 
    directly.
- `Logger.paddings` was removed.

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
- `winston.paddings` was removed.

## Upgrading to `winston.format`
The biggest issue with `winston@2` and previous major releases was that any
new formatting options required changes to `winston` itself. All formatting is
now handled by **formats**. 

Custom formats can now be created with no changes to `winston` core.
_We encourage you to consider a custom format before opening an issue._

### Removed `winston.Logger` formatting options
- The default output format is now `formats.json()`.
- `filters`: Use a custom `format`. See: [Filters and Rewriters] below.
- `rewriters`: Use a custom `format`. See: [Filters and Rewriters] below.

### Removed `winston.transports.{File,Console,Http}` formatting options
- `stringify`: Use a [custom format].
- `formatter`: Use a [custom format].
- `json`: Use `formats.json()`.
- `raw`: Use `formats.json()`.
- `label`: Use `formats.label()`.
- `logstash`: Use `formats.logstash()`.
- `prettyPrint`: Use `formats.prettyPrint()` or a [custom format].
   - `depth` is an option provided to `formats.prettyPrint()`.
- `colorize`: Use `formats.colorize()`.
- `timestamp`: Use `formats.timestamp()`.
- `logstash`: Use `formats.logstash()`.
- `align`: Use `formats.align()`.
- `showLevel`: Use a [custom format].

### Migrating `filters` and `rewriters` to `formats` in `winston@3`

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

See [examples/format-mutate.js](/examples/format-mutate.js) for a complete
end-to-end example that covers both filtering and rewriting behavior in
`winston@2.x`.

## Modularity: `winston-transport`, `logform` and more

As of `winston@3.0.0` the project has been broken out into a few modules:

- [winston-transport]: `Transport` stream implementation & legacy `Transport`
  wrapper.
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

[Breaking changes]: #breaking-changes
[Top-level `winston.*` API]: #top-level-winston-api
[Transports]: #transports
[`winston.Container` and `winston.loggers`]: #winstoncontainer-and-winstonloggers
[`winston.Logger`]: #winstonlogger
[Exceptions & exception handling]: #exceptions--exception-handling
[Other minor breaking changes]: #other-minor-breaking-changes
[Upgrading to `winston.format`]: #upgrading-to-winstonformat
[Removed `winston.Logger` formatting options]: #removed-winstonlogger-formatting-options
[Removed `winston.transports.{File,Console,Http}` formatting options]: #removed-winstontransportsfileconsolehttp-formatting-options
[Migrating `filters` and `rewriters` to `formats` in `winston@3`]: #migrating-filters-and-rewriters-to-formats-in-winston3
[Modularity: `winston-transport`, `logform` and more]: #modularity-winston-transport-logform-and-more

[Filters and Rewriters]: #migrating-filters-and-rewriters-to-formats-in-winston3
[custom format]: /README.md#creating-custom-formats

[winston-transport]: https://github.com/winstonjs/winston-transport
[logform]: https://github.com/winstonjs/logform
[triple-beam]: https://github.com/winstonjs/triple-beam
[abstract-winston-transport]: https://github.com/winstonjs/abstract-winston-transport

