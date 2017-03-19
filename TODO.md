
## Core logging
- [x] Move `TransportStream` and `LegacyTransportStream` into `winston-transport`.
- [ ] `.level` **MUST** be a getter / setter
- [ ] `.levels` **MUST** be a getter only.
- [x] Move `winston/config.js` to `winston/config/index.js`
- [x] **DEPRECATE** `winston.clone`
- [x] Add convenience methods from `winston-transport`
- [ ] Replace all `vows`-based tests.
- [ ] Code coverage tests above 80%

## Transports
- [ ] Implement `stream.Writable.writev` in `TransportStream`.
- [-] Refactor all built-in transports to be TransportStream instances.
  - [x] Console
  - [-] File
  - [x] Http
  - [x] Steam

## Formats
- [ ] String interpolation format
- [x] Colorize format
- [x] Pretty-print format
- [x] Uncolorize format
- [ ] winston.format.cli()

## Communications / Compatibility
- [x] Add friendly(ish) deprecation notices for common changes.
- [x] winston-compat
- [ ] README.md  for `winston-transport`.
- [ ] 90%+ test coverage for `winston-transport`.
- [ ] README.md / tests for `winston-compat`
- [ ] Move core tests into `winston-compat`
- [ ] 90%+ test coverage for `winston-compat`.

## Querying, Streaming, Uncaught Exceptions

- [-] Querying
- [-] Streaming
- [x] Uncaught Exceptions

## Other Miscellaneous API changes

- [x] Move `LogStream` back to `Logger`.
- [x] Add LogStream.prototype.configure from `winston@2.0.0`
- [x] `winston.Container` instances no longer add any transports by default.
- [ ] Strip wrapping `(` `)` from all occurances of `new (winston.transports.*)`.

## Benchmarking

- [-] Benchmark against winston@2.0.0
- [-] Benchmark JSON format against bunyan
