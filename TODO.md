
## Communications / Compatibility

- [ ] README.md / tests for `winston-transport`
- [ ] README.md / tests for `winston-compat`
- [ ] Move core tests into `winston-compat`

## Core logging

- [x] Move `TransportStream` and `LegacyTransportStream` into `winston-transport`.
- [ ] `.level` **MUST** be a getter / setter
- [ ] `.levels` **MUST** be a getter only.
- [x] Move `winston/config.js` to `winston/config/index.js`
- [x] **DEPRECATE** `winston.clone`
- [ ] Add convenience methods from `winston-logger`
- [ ] Code coverage tests above 80%

## Formats

- [ ] String interpolation format
- [x] Colorize format
- [x] Pretty-print format
- [x] Uncolorize format
- [ ] winston.format.cli()

## Compatibility

- [x] Add friendly(ish) deprecation notices for common changes.
- [x] winston-compat

## Querying, Streaming, Uncaught Exceptions

- [-] Querying
- [-] Streaming
- [x] Uncaught Exceptions

## Transports

- [-] Refactor all built-in transports to be TransportStream instances.
  - [x] Console
  - [-] File
  - [x] Http

## Other Miscellaneous API changes

- [x] Move `LogStream` back to `Logger`.
- [x] Add LogStream.prototype.configure from `winston@2.0.0`
- [x] `winston.Container` instances no longer add any transports by default.

## Benchmarking

- [-] Benchmark against winston@2.0.0
- [-] Benchmark JSON format against bunyan
