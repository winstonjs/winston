# CONTRIBUTING

TL;DR? The `winston` project recently shipped `3.0.0` out of RC and is actively
working towards the next feature release as it continues to triage issues. 

- [Be kind & actively empathetic to one another](CODE_OF_CONDUCT.md)
- [What makes up `winston`?](#what-makes-up-winston)
- [What about `winston@2.x`?!](#what-about-winston-2.x)
- [Could this be implemented as a format?](#could-this-be-implemented-as-a-format)
- [Roadmap](#roadmap)

Looking for somewhere to help? Checkout the [Roadmap](#roadmap) & help triage open issues! Find an issue that looks like a duplicate? It probably is! Comment on it so we know it's maybe a duplicate 🙏.

## What makes up `winston`?

As of `winston@3` the project has been broken out into a few modules:

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
    printf(({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console()]
});
```

## What about `winston@2.x`?!

> _If you are opening an issue regarding the `2.x` release-line please know
> that 2.x work has ceased. The `winston` team will review PRs that fix
> issues, but as issues are opened we will close them._

You will commonly see this closing `winston@2.x` issues:

```
Development `winston@2.x` has ceased. Please consider upgrading to
`winston@3.0.0`. If you feel strongly about this bug please open a PR against
the `2.x` branch. Thank you for using `winston`!
```

## Could this be implemented as a format?

Before opening issues for new features consider if this feature could be implemented as a [custom format]. If it is, you will see your issue closed with this message:

```
This can be accomplished with using [custom formats](https://github.com/winstonjs/winston#creating-custom-formats) in `winston@3.0.0`. Please consider upgrading.
```

# Roadmap

Below is the list of items that make up the roadmap through `3.4.0`. We are actively triaging the open issues, so it is likely a few more critical path items will be added to this list before the next release goes out.

- [Version 3.3.0](#version-320)
- [Version 3.4.0](#version-330)
- [Version 3.5.0](#version-340)

## Legend

- [ ] Unstarted work.
- [x] Finished work.
- [-] Partially finished or in-progress work. 

## Version `3.3.0`

### High priority issues (non-blocking)
- [ ] Move `File` transport into `winston-file`.
- [Browser support](https://github.com/winstonjs/winston/issues/287)
  - [ ] Unit tests for `webpack` & `rollup` 
  - [ ] Replicate browser-only transpilation for `winston`, `winston-transport`, `triple-beam`.
- [-] Full JSDoc coverage
- Benchmarking for `File` and `Stream` transports:
   - [x] Benchmarking integration in `pino`.
   - [x] Upgrade `pino` to latest `winston`.
   - See: https://github.com/winstonjs/logmark
   - See also: https://github.com/pinojs/pino/pull/232
- [ ] Move `logged` event into `winston-transport` to remove need for it in each individual Transport written _or remove the `logged` event entirely._

### Increased code & scenario coverage
- [-] Replace all `vows`-based tests.
  - [-] `test/transports/*-test.js` 
- [ ] Code coverage tests above 80% for `winston` _(currently `~70%`)_.
  - [-] Core scenarios covered in `abstract-winston-transport`.
  - [-] Full integration tests for all `logform` transports

### Communications / Compatibility
- [ ] `README.md` for `winston-compat`.
- [ ] Update all transports documented in `docs/transports.md` for `winston@3`.

## Version `3.4.0`

### Querying, Streaming, Uncaught Exceptions
- [-] Streaming

### Communications / Compatibility
- [ ] `winstonjs.org` documentation site.

## Version `3.5.0`

### Querying, Streaming, Uncaught Exceptions
- [-] Querying

[winston-transport]: https://github.com/winstonjs/winston-transport
[logform]: https://github.com/winstonjs/logform
[triple-beam]: https://github.com/winstonjs/triple-beam
[abstract-winston-transport]: https://github.com/winstonjs/abstract-winston-transport
[stress-test]: https://github.com/winstonjs/winston/blob/master/test/transports/file-stress.test.js
[custom format]: https://github.com/winstonjs/winston#creating-custom-formats
