# Past Release Roadmaps

Below is the list of items that made up the roadmap for past releases. 

- [Version 3.0.0](#version-300)

## Legend

- [ ] Unstarted work.
- [x] Finished work.
- [-] Partially finished or in-progress work. 

## Version `3.0.0`

### Show stoppers
- [x] `silent` support.
- [x] Finish `3.0.0` upgrade guide: https://github.com/winstonjs/winston/blob/master/UPGRADE-3.0.md
- [x] Triage all open issues since October 2017

### High priority issues (non-blocking)
- [x] [#1144]: this is _the_ purpose of `winston`. If we cannot log at high-volume we cannot ship out of RC. There was [test coverage for this][stress-test] that should be failing, but isnt. _(Fixed by #1291)._
- [x] Error handling within formats [#1261]
- [x] Update `docs/transports.md`.
- [Type definitions for TypeScript](https://github.com/winstonjs/winston/issues/1096)
  - [x] Supporting libraries: `winston-transport`, `logform`
  - [x] `winston` itself 

### Core logging
- [x] Make `Logger.prototype.level` and `Transport.level` play nice(r) together.
- [x] Remove `new winston.Logger` in favor of `winston.createLogger`.
- [x] Finish implementation for `TransportStream` and `LegacyTransportStream`. 
- [x] Move `TransportStream` and `LegacyTransportStream` into `winston-transport`.
- [x] Move `winston/config.js` to `winston/config/index.js`
- [x] **DEPRECATE** `winston.clone`
- [x] Add convenience methods from `winston-transport`
- [-] Replace all `vows`-based tests.
  - [x] `test/*-test.js`
  - [x] `test/formats/*-test.js` 
  - [-] `test/transports/*-test.js` 
- [x] Move `winston.config` into `triple-beam` around a base `Levels` class.
  _(Fixed in `triple-beam@1.2.0`)_
- [x] Update to the latest `npm` levels (e.g. including `http`).
- [ ] Code coverage tests above 80% for `winston` _(currently `~72%`)_.
- [x] Code coverage tests above 90% for `winston-transport`.
- [x] Code coverage tests above 90% for `logform`
- [-] Core scenarios covered in `abstract-winston-transport`.
- [x] Code coverage tests above 60% for `winston-compat`.

### Transports
- [x] Implement `stream.Writable.writev` in `TransportStream`.
- [x] Refactor all built-in transports to be TransportStream instances.
  - [x] Console
  - [x] File
  - [x] Http
  - [x] Steam

### Formats
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
- [x] `winston.format.padLevels()` format.
- [x] `humanReadableUnhandledException` should be the default

### Communications / Compatibility
- [x] Add friendly(ish) deprecation notices for common changes.
- [x] Create `winston-compat` to help with backwards compatibility for transport authors.  
- [x] Update the `README.md` in `winston`.
- [x] `README.md` for `winston-transport`.
- [x] `README.md` for `logform`.
- [x] Migrate all `examples/*.js` to the new API.

### Querying, Streaming, Uncaught Exceptions
- [x] Uncaught Exceptions

### Other Miscellaneous API changes
- [x] Move `LogStream` back to `Logger`.
- [x] Add LogStream.prototype.configure from `winston@2.0.0`
- [x] `winston.Container` instances no longer add any transports by default.
- [x] Strip wrapping `(` `)` from all occurances of `new winston.transports.*)`

### Benchmarking
- [x] Benchmark against `winston@1.0.0` in `logmark`.
- [x] Benchmark against `winston@2.0.0` in `logmark`.
- [x] Benchmark JSON format against `bunyan` in `logmark`.
- [x] Benchmark against `pino` in `logmark`.
- [x] Submit PR for all `pino` benchmarks.
