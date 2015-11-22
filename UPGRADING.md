
### Braindump of breaking changes

- `winston.Logger` will no longer respond with an error when logging with no transports
- `winston.Logger` will no longer respond with an error if the same transports are added twice.
- `winston.hash` was removed.
- `winston.common.pad` was removed.
- `winston.Container` instances no longer have default `Console` transports
- `winston.Container.prototype.add` no longer does crazy options parsing similar to [segmentio/winston-logger](https://github.com/segmentio/winston-logger/blob/master/lib/index.js#L20-L43)
- `winston.transports.Memory` was removed. Use any streams2 with a large `highWaterMark` instance instead.
- `.unhandleExceptions()` will no longer modify transports state, merely just add / remove the `process.on('uncaughtException')` handler.
  - call close on any explicit `exceptionHandlers`
  - set handleExceptions = false on all transports

- winston.exceptions has been removed. Use:
```
var exceptions = winston.exceptionHandler();
```
