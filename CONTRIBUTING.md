# CONTRIBUTING

TL;DR? The `winston` project recently shipped `3.0.0` out of RC and is actively
working towards the next feature release as it continues to triage issues. 

- [Be kind & actively empathetic to one another](CODE_OF_CONDUCT.md)
- [What makes up `winston@3.0.0`?](#what-makes-up-winston-3.0.0)
- [What about `winston@2.x`?!](#what-about-winston-2.x)
- [Could this be implemented as a format?](#could-this-be-implemented-as-a-format)
- [Roadmap](#roadmap)
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

Below is the list of items that make up the roadmap through `3.3.0`. We are actively triaging the open issues, so it is likely a few more critical path items will be added to this list before the next release goes out.

- [Version 3.1.0](#version-310)
- [Version 3.2.0](#version-320)
- [Version 3.3.0](#version-330)

## Legend

- [ ] Unstarted work.
- [x] Finished work.
- [-] Partially finished or in-progress work. 

## Version `3.1.0`

### High priority issues (non-blocking)
- [Browser support](https://github.com/winstonjs/winston/issues/287)
  - [ ] Unit tests for `webpack` & `rollup` 
- Benchmarking for `File` and `Stream` transports:
   - [x] Benchmarking integration in `pino`.
   - [ ] Upgrade `pino` to latest `winston`.
   - See: https://github.com/winstonjs/logmark
   - See also: https://github.com/pinojs/pino/pull/232
- [ ] Move `logged` event into `winston-transport` to remove need for it in each individual Transport written _or remove the `logged` event entirely._

### Increased code & scenario coverage
- [-] Replace all `vows`-based tests.
  - [-] `test/transports/*-test.js` 
- [ ] Code coverage tests above 80% for `winston` _(currently `~72%`)_.
  - [-] Core scenarios covered in `abstract-winston-transport`.

### Communications / Compatibility
- [ ] `README.md` for `winston-compat`.
- [ ] All formats documented in `logform`.
- [ ] All existing transports documented in `docs/transports.md`.

## Version `3.2.0`

### Querying, Streaming, Uncaught Exceptions
- [-] Streaming

### Communications / Compatibility
- [ ] `winstonjs.org` documentation site.

## Version `3.3.0`

### Querying, Streaming, Uncaught Exceptions
- [-] Querying

[winston-transport]: https://github.com/winstonjs/winston-transport
[logform]: https://github.com/winstonjs/logform
[triple-beam]: https://github.com/winstonjs/triple-beam
[abstract-winston-transport]: https://github.com/winstonjs/abstract-winston-transport
[stress-test]: https://github.com/winstonjs/winston/blob/master/test/transports/file-stress.test.js
[custom format]: https://github.com/winstonjs/winston#creating-custom-formats
