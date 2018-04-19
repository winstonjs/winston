# Upgrading to `winston@3.0.0`

> This document is a **work in progress.** Having trouble upgrading to 
> `winston@3.0.0-rc{X}`? Open an issue so we can improve this guide! 

## Major breaking changes

- `winston.Logger` has been replaced with `winston.createLogger`.
- `winston.setLevels` has been removed. Levels are frozen at the time of Logger creation.
- Setting the level on the default `winston` logger no longer sets the level on the transports associated with the default `winston` logger.

## Formatting options
- Default output format is now `formats.json()`.

### `winston.Logger`
- `filters`: Use a custom `format`. See: [Formatters and Rewriters] below.
- `rewriters`: Use a custom `format`. See: [Formatters and Rewriters] below.

### `winston.transports.{File,Console,Http}`
- `stringify`: Use a custom `format`.
- `formatter`: Use a custom `format`.
- `json`: Use `formats.json()`.
- `raw`: Use `formats.json()`.
- `prettyPrint`: Use `formats.prettyPrint()` or a custom `format`.
- `colorize`: Use `formats.colorize()`.
- `timestamp`: Use `formats.timestamp()`.
- `logstash`: Use `formats.logstash()`.
- `align`: Use `formats.align()`.
- `showLevel`: Use a custom `format`.

## `winston.Logger`
- `winston.Logger` will no longer respond with an error when logging with no transports
- `winston.Logger` will no longer respond with an error if the same transports are added twice.
- `Logger.prototype.stream`
  - `options.transport` is removed. Use the transport instance on the logger directly.
- `Logger.prototype.query`
  - `options.transport` is removed. Use the transport instance on the logger directly.

## Migrating `formatters` and `rewriters` to `formats` in `winston@3`

In `winston@3.x.x` `info` objects are considered mutable. The API _combined
formatters and rewriters into a single, new concept:_ **formats**. 

### Filters

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

### Rewriters

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

## Exceptions & exception handling
- `winston.exception` has been removed. Use:
``` js
const exception = winston.ExceptionHandler();
```
- `humanReadableUnhandledException` is now the default exception format.
- `.unhandleExceptions()` will no longer modify transports state, merely just add / remove the `process.on('uncaughtException')` handler.
  - Call close on any explicit `ExceptionHandlers`.
  - Set `handleExceptions = false` on all transports.

## Transports
- `winston.transports.Memory` was removed. Use any Node.js `stream.Writeable` with a large `highWaterMark` instance instead.
- When writing transports use `winston-transport` instead of `winston.Transport`

## `winston.Container` and `winston.loggers`
- `winston.Container` instances no longer have default `Console` transports
- `winston.Container.prototype.add` no longer does crazy options parsing. Implementation inspired by [segmentio/winston-logger](https://github.com/segmentio/winston-logger/blob/master/lib/index.js#L20-L43)

## Minor breaking changes
- `winston.hash` was removed.
- `winston.common.pad` was removed.
- `winston.common.serialized` was removed (use `winston-compat`).
- `winston.common.log` was removed (use `winston-compat`).

## New dependencies 
- `winston-transport`
- `abstract-winston-transport`
- `logform`
