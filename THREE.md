# winston@3 remaining items

## Core logging
- [x] Remove `new winston.Logger` in favor of `winston.createLogger`.
- [x] Finish implementation for `TransportStream` and `LegacyTransportStream`. 
- [x] Move `TransportStream` and `LegacyTransportStream` into `winston-transport`.
- [x] Move `winston/config.js` to `winston/config/index.js`
- [x] **DEPRECATE** `winston.clone`
- [x] Add convenience methods from `winston-transport`
- [-] Replace all `vows`-based tests.
  - [x] `test/*-test.js`
  - [-] `test/formats/*-test.js` 
  - [-] `test/transports/*-test.js` 
- [ ] Code coverage tests above 80% for `winston` _(currently `~72%`)_.
  - [x] Code coverage tests above 90% for `winston-transport`.
  - [-] Code coverage tests above 90% for `logform` _(currently `~65%`)_.
  - [ ] Core scenarios covered in `abstract-winston-transport`.

## Transports
- [x] Implement `stream.Writable.writev` in `TransportStream`.
- [x] Refactor all built-in transports to be TransportStream instances.
  - [x] Console
  - [x] File
  - [x] Http
  - [x] Steam

## Formats
- [x] `winston.format.colorize()` format.
- [x] `winston.format.prettyPrint()` format.
- [x] `winston.format.uncolorize()` format.
- [ ] `winston.format.padLevels()` format.
- [x] `winston.format.logstash()` format.
- [ ] `winston.format.cli()`
- [ ] String interpolation _(i.e. splat)_ via format
- [ ] `humanReadableUnhandledException` should be the default
- [ ] Mutable levels via `displayLevel` (for `colorize`). 
- [x] Use of different formats across multiple Transports. e.g.:
  - Colors on `Console`
  - Not on `File`

## Communications / Compatibility

- [x] Add friendly(ish) deprecation notices for common changes.
- [x] Create `winston-compat` to help with backwards compatibility for transport authors.  
- [ ] Update the `README.md` in `winston`.
- [ ] Update examples in `docs/transports.md`.
- [ ] README.md  for `winston-transport`.
- [ ] 90%+ test coverage for `winston-transport`.
- [ ] README.md / tests for `winston-compat`
- [ ] Move core tests into `winston-compat`
- [ ] 90%+ test coverage for `winston-compat`.
- [-] Migrate all `examples/*.js` to the new API.

## Querying, Streaming, Uncaught Exceptions

- [-] Querying
- [-] Streaming
- [x] Uncaught Exceptions

## Other Miscellaneous API changes

- [x] Move `LogStream` back to `Logger`.
- [x] Add LogStream.prototype.configure from `winston@2.0.0`
- [x] `winston.Container` instances no longer add any transports by default.
- [x] Strip wrapping `(` `)` from all occurances of `new winston.transports.*)`

## Benchmarking

- [x] Benchmark against winston@2.0.0
- [x] Benchmark JSON format against bunyan
- [x] Benchmark against `pino` in `logmark`.
- [-] Submit PR for all `pino` benchmarks.
