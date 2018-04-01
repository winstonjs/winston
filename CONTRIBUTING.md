# CONTRIBUTING

TL;DR? The `winston` project is actively working towards getting `3.0.0` out of RC (currently `3.0.0-rc1`). 

- [What makes up `winston@3.0.0`?](#what-makes-up-winston-3.0.0)
- [What about `winston@2.x`?!](#what-about-winston-2.x)
- [Could this be implemented as a format?](#could-this-be-implemented-as-a-format)
- [Roadmap](#roadmap)
   - [Bugs](#bugs)
   - [Documentation](#documentation)
   - [Feature Requests](#feature-requests)
- [Be kind & actively empathetic to one another](CODE_OF_CONDUCT.md)

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
Development `winston@2.x` has ceased. Please consider upgrading to `winston@3.0.0-rc3`. If you feel strongly about this bug please open a PR against the `2.x` branch. Thank you for using `winston`!
```

## Could this be implemented as a format?

Before opening issues for new features consider if this feature could be implemented as a [custom format]. If it is, you will see your issue closed with this message:

```
In `winston@3.0.0` you can <IMPLEMENT FEATURE> using [custom formats](https://github.com/winstonjs/winston#creating-custom-formats). Please consider upgrading.
```

## Roadmap

Below is the list of items that make up the roadmap through `3.1.0`. We are actively triaging the open issues, so it is likely a few more critical path items will be added to this list before `3.0.0` gets out of RC.

- [Bugs](#bugs)
- [Documentation](#documentation)
- [Feature Requests](#feature-requests)

### Bugs

#### Show stoppers before `3.0.0`

- [ ] https://github.com/winstonjs/winston/issues/1144: this is _the_ purpose of `winston`. If we cannot log at high-volume we cannot ship out of RC. There was [test coverage for this][stress-test] that should be failing, but isnt
- [ ] Triage all open issues.

### Documentation

- [ ] Finish `3.0.0` upgrade guide: https://github.com/winstonjs/winston/blob/master/UPGRADE-3.0.md
- [ ] Update `docs/transports.md`.

### Feature Requests

Below is the known set of high-priority feature requests to support the community. Don't see your request here? Get more 👍!

#### Must have before `3.0.0`

There are no known feature requests that are considered **must have** for `3.0.0` to get out of RC. 

#### Must have before `3.1.0`

- [Type definitions for TypeScript](https://github.com/winstonjs/winston/issues/1096)
- [Browser support](https://github.com/winstonjs/winston/issues/287)
- Benchmarking for `File` and `Stream` transports:
   - See: https://github.com/winstonjs/logmark
   - See also: https://github.com/pinojs/pino/pull/232

[winston-transport]: https://github.com/winstonjs/winston-transport
[logform]: https://github.com/winstonjs/logform
[triple-beam]: https://github.com/winstonjs/triple-beam
[abstract-winston-transport]: https://github.com/winstonjs/abstract-winston-transport
[stress-test]: https://github.com/winstonjs/winston/blob/master/test/transports/file-stress.test.js
[custom format]: https://github.com/winstonjs/winston#creating-custom-formats
