
## Core logging

- `.level` **MUST** be a getter / setter
- `.levels` **MUST** be a getter only.

## Formats

- [ ] String interpolation format
- [ ] Colorize format
- [ ] Pretty-print format
- [ ] Uncolorize format

## Querying, Streaming, Uncaught Exceptions

- [ ] Querying
- [ ] Streaming
- [ ] Uncaught Exceptions

## Transports

- [ ] Refactor all built-in transports to be TransportStream instances.

### Console

### File

### Http

### Memory

## Other Miscellaneous API changes

- [ ] Add LogStream.prototype.configure from `winston@2.0.0`
- [ ] `winston.Container` instances no longer add any transports by default.

## Benchmarking

- [ ] Benchmark against winston@2.0.0
- [ ] Benchmark JSON format against bunyan
