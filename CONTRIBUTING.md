# CONTRIBUTING

TL;DR? The `winston` project is actively working towards getting `3.0.0` out of RC (currently `3.0.0-rc5`). 

- [Be kind & actively empathetic to one another](CODE_OF_CONDUCT.md)
- [What makes up `winston@3.0.0`?](#what-makes-up-winston-3.0.0)
- [What about `winston@2.x`?!](#what-about-winston-2.x)
- [Could this be implemented as a format?](#could-this-be-implemented-as-a-format)
- [Roadmap](#roadmap)
  - [Version 3.0.0](#version-300)
  - [Version 3.1.0](#version-310)

Looking for somewhere to help? Checkout the [Roadmap](#roadmap) & help triage open issues! Find an issue that looks like a duplicate? It probably is! Comment on it so we know it's maybe a duplicate 🙏.

## What makes up `winston@3.0.0`?

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

## What about `winston@2.x`?!

> _If you are opening an issue regarding the `2.x` release-line please know that 2.x work has ceased. The `winston` team will review PRs that fix issues, but as issues are opened we will close them._

You will commonly see this closing `winston@2.x` issues:

```
Development `winston@2.x` has ceased. Please consider upgrading to `winston@3.0.0-rc5`. If you feel strongly about this bug please open a PR against the `2.x` branch. Thank you for using `winston`!
```

## Could this be implemented as a format?

Before opening issues for new features consider if this feature could be implemented as a [custom format]. If it is, you will see your issue closed with this message:

```
This can be accomplished with using [custom formats](https://github.com/winstonjs/winston#creating-custom-formats) in `winston@3.0.0`. Please consider upgrading.
```

# Roadmap

Below is the list of items that make up the roadmap through `3.1.0`. We are actively triaging the open issues, so it is likely a few more critical path items will be added to this list before `3.0.0` gets out of RC.

- [Version 3.0.0](#version-300)
- [Version 3.1.0](#version-310)

## Legend

- [ ] Unstarted work.
- [x] Finished work.
- [-] Partially finished or in-progress work. 

## Version `3.0.0`

### Show stoppers
- [x] `silent` support.
- [x] Finish `3.0.0` upgrade guide: https://github.com/winstonjs/winston/blob/master/UPGRADE-3.0.md
- [ ] Triage all open issues since October 2017

### High priority issues (non-blocking)
- [x] [#1144]: this is _the_ purpose of `winston`. If we cannot log at high-volume we cannot ship out of RC. There was [test coverage for this][stress-test] that should be failing, but isnt. _(Fixed by #1291)._
- [ ] Error handling within formats [#1261]
- [ ] Update `docs/transports.md`.

### Core logging
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
- [x] Move `winston.config` into `triple-beam` around a base `Levels` class.
  _(Fixed in `triple-beam@1.2.0`)_
- [ ] Update to the latest `npm` levels (e.g. including `http`).
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
- [ ] Move `logged` event into `winston-transport` to remove need for it in each individual Transport written.

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
- [ ] `README.md` for `winston-compat`.
- [x] `README.md` for `logform`.
- [x] Migrate all `examples/*.js` to the new API.

### Querying, Streaming, Uncaught Exceptions
- [x] Uncaught Exceptions
- [-] Querying
- [-] Streaming

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

## Version `3.1.0`

### High priority issues (non-blocking)
- [Type definitions for TypeScript](https://github.com/winstonjs/winston/issues/1096)
  - [x] Supporting libraries: `winston-transport`, `logform`
  - [ ] `winston` itself 
- [Browser support](https://github.com/winstonjs/winston/issues/287)
  - [ ] Unit tests for `webpack` & `rollup` 
- Benchmarking for `File` and `Stream` transports:
   - [x] Benchmarking integration in `pino`.
   - [ ] Upgrade `pino` to latest `winston`.
   - See: https://github.com/winstonjs/logmark
   - See also: https://github.com/pinojs/pino/pull/232

[winston-transport]: https://github.com/winstonjs/winston-transport
[logform]: https://github.com/winstonjs/logform
[triple-beam]: https://github.com/winstonjs/triple-beam
[abstract-winston-transport]: https://github.com/winstonjs/abstract-winston-transport
[stress-test]: https://github.com/winstonjs/winston/blob/master/test/transports/file-stress.test.js
[custom format]: https://github.com/winstonjs/winston#creating-custom-formats
