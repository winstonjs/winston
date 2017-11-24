# winston@3 remaining items

## Core logging
- [ ] Make `Logger.prototype.level` a setter to set level on transports.
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
- [ ] Move `winston.config` into `triple-beam` around a base `Levels` class.
- [ ] Update to the latest `npm` levels (e.g. including `http`).
- [ ] Code coverage tests above 80% for `winston` _(currently `~72%`)_.
  - [x] Code coverage tests above 90% for `winston-transport`.
  - [x] Code coverage tests above 90% for `logform`
  - [-] Core scenarios covered in `abstract-winston-transport`.
  - [x] Code coverage tests above 60% for `winston-compat`.

## Transports
- [x] Implement `stream.Writable.writev` in `TransportStream`.
- [x] Refactor all built-in transports to be TransportStream instances.
  - [x] Console
  - [x] File
  - [x] Http
  - [x] Steam
- [ ] Move `logged` event into `winston-transport` to remove need for it in each individual Transport written.

## Formats
- [x] `winston.format.colorize()` format.
- [x] `winston.format.prettyPrint()` format.
- [x] `winston.format.uncolorize()` format.
- [x] `winston.format.logstash()` format.
- [x] `winston.format.cli()`
- [x] String interpolation _(i.e. splat)_ via format
- [x] Use of different formats across multiple Transports. e.g.:
   - Colors on `Console`
   - Not on `File`
- [x] Mutable levels on `info` objects 
   – Use `triple-beam` and `Symbol.for('level')`.
   - Needed for `winston.formats.colorize()`. 
- [x] Quieter finalized output using `Symbol.for('message')` 
- [x] Filtering messages completely in a format.
- [ ] `winston.format.padLevels()` format.
- [ ] `humanReadableUnhandledException` should be the default

## Communications / Compatibility

- [x] Add friendly(ish) deprecation notices for common changes.
- [x] Create `winston-compat` to help with backwards compatibility for transport authors.  
- [x] Update the `README.md` in `winston`.
- [ ] Update examples in `docs/transports.md`.
- [x] `README.md` for `winston-transport`.
- [ ] `README.md` for `winston-compat`.
- [x] `README.md` for `logform`.
- [x] Migrate all `examples/*.js` to the new API.

## Querying, Streaming, Uncaught Exceptions

- [x] Uncaught Exceptions
- [-] Querying
- [-] Streaming

## Other Miscellaneous API changes

- [x] Move `LogStream` back to `Logger`.
- [x] Add LogStream.prototype.configure from `winston@2.0.0`
- [x] `winston.Container` instances no longer add any transports by default.
- [x] Strip wrapping `(` `)` from all occurances of `new winston.transports.*)`

## Benchmarking

- [x] Benchmark against `winston@1.0.0` in `logmark`.
- [x] Benchmark against `winston@2.0.0` in `logmark`.
- [x] Benchmark JSON format against `bunyan` in `logmark`.
- [x] Benchmark against `pino` in `logmark`.
- [-] Submit PR for all `pino` benchmarks.
