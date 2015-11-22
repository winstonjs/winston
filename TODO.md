
## Core logging

- [ ] `.level` **MUST** be a getter / setter
- [ ] `.levels` **MUST** be a getter only.
- [ ] **DEPRECATE** `winston.config.*` and move to `winston.levels`.
- [x] **DEPRECATE** `winston.clone`

## Formats

- [ ] String interpolation format
- [ ] Colorize format
- [ ] Pretty-print format
- [ ] Uncolorize format
- [ ] winston.format.cli()

## Compatibility

- [x] Add friendly(ish) deprecation notices for common changes.
- [-] winston-compat

## Querying, Streaming, Uncaught Exceptions

- [ ] Querying
- [ ] Streaming
- [x] Uncaught Exceptions

## Transports

- [ ] Refactor all built-in transports to be TransportStream instances.
  - [x] Console
  - [-] File
  - [ ] Http

## Other Miscellaneous API changes

- [x] Add LogStream.prototype.configure from `winston@2.0.0`
- [x] `winston.Container` instances no longer add any transports by default.

## Benchmarking

- [-] Benchmark against winston@2.0.0
- [-] Benchmark JSON format against bunyan
