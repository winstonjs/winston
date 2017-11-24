# Upgrading to `winston@3.0.0`

> This document is a **work in progress.** Having trouble upgrading to 
> `winston@3.0.0-rc{X}`? Open an issue so we can improve this guide! 

## Major breaking changes

- `winston.Logger` has been replaced with `winston.createLogger`.
- `winston.setLevels` has been removed. Levels are frozen at the time of Logger creation.
- Setting the level on the default `winston` logger no longer sets the level on the transports associated with the default `winston` logger.

## Formatting options
- Default output format is now `formats.json()`.

#### `winston.Logger`
- `filters`: Use a custom `format`.
- `rewriters`: Use a custom `format`.

#### `winston.transports.{File,Console,Http}`
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

## Exceptions & exception handling
- `winston.exceptions` has been removed. Use:
``` js
const exceptions = winston.exceptionHandler();
```
- `humanReadableUnhandledException` is now the default exception format.
- `.unhandleExceptions()` will no longer modify transports state, merely just add / remove the `process.on('uncaughtException')` handler.
  - Call close on any explicit `exceptionHandlers`.
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
