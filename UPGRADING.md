
### Major breaking changes

- `winston.Logger` has been replaced with `winston.createLogger`.
- `winston.setLevels` has been removed. Levels are frozen at the time of Logger creation.
- `winston.Logger` will no longer respond with an error when logging with no transports
- `winston.Logger` will no longer respond with an error if the same transports are added twice.
- `Logger.prototype.stream`
  - `options.transport` is removed. Use the transport instance on the logger directly.
- `Logger.prototype.query`
  - `options.transport` is removed. Use the transport instance on the logger directly.
- Setting the level on the default `winston` logger no longer sets the level on the transports associated with the default `winston` logger.
- `winston.transports.Memory` was removed. Use any Node.js `stream.Writeable` with a large `highWaterMark` instance instead.
- `winston.Container` instances no longer have default `Console` transports
- `winston.Container.prototype.add` no longer does crazy options parsing. Implementation inspired by [segmentio/winston-logger](https://github.com/segmentio/winston-logger/blob/master/lib/index.js#L20-L43)

### New dependencies 

- `winston-transport`
- `abstract-winston-transport`
- `logform`

### Exceptions & exception handling
- `winston.exceptions` has been removed. Use:
``` js
const exceptions = winston.exceptionHandler();
```
- `humanReadableUnhandledException` is now the default exception format.
- `.unhandleExceptions()` will no longer modify transports state, merely just add / remove the `process.on('uncaughtException')` handler.
  - Call close on any explicit `exceptionHandlers`.
  - Set `handleExceptions = false` on all transports.

### Minor breaking changes
- `winston.hash` was removed.
- `winston.common.pad` was removed.
- `winston.common.serialized` was removed (use `winston-compat`).
- `winston.common.log` was removed (use `winston-compat`).

### Below this is mostly unstructured braindump

**Common**
``` js
{
  level: 'info',
  message: 'Something happened.'
}
```

**Less common**
``` js
{
  label: 'some label',
  timestamp: new Date().toISOString() || function () {},
  raw: true,
  showLevel: false,
  align: true // uses \t instead of ' '
}
```

**Now formats**
``` js
{
  json: true,
  logstash: true,
  colorize: 'all' || 'level' || 'message' || true,
  prettyPrint: true || function () {}
    // depth
    // colorize
}
```

**Other notes**
- `stringify`: Use a custom format.
- `formatter`: Use a custom format.
