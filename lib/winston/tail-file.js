const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const Stream = require('stream').Stream;

// Simple no-op function
function nop() {}

//
// ### function tailFile (options, iter)
// #### @options {Object} Options for tail.
// #### @iter {function} Iterator function to execute on every line.
// `tail -f` a file. Options must include file.
//
module.exports = function tailFile(options, iter) {
  const buffer = Buffer.alloc(64 * 1024);
  const decode = new StringDecoder('utf8');
  const stream = new Stream();
  let buff = '';
  let pos = 0;
  let row = 0;

  if (options.start === -1) {
    delete options.start;
  }

  stream.readable = true;
  stream.destroy = function () {
    stream.destroyed = true;
    stream.emit('end');
    stream.emit('close');
  };

  fs.open(options.file, 'a+', '0644', function (err, fd) {
    if (err) {
      if (!iter) {
        stream.emit('error', err);
      } else {
        iter(err);
      }
      stream.destroy();
      return;
    }

    (function read() {
      if (stream.destroyed) {
        fs.close(fd, nop);
        return;
      }

      return fs.read(fd, buffer, 0, buffer.length, pos, function (err, bytes) {
        if (err) {
          if (!iter) {
            stream.emit('error', err);
          } else {
            iter(err);
          }
          stream.destroy();
          return;
        }

        if (!bytes) {
          if (buff) {
            // eslint-disable-next-line eqeqeq
            if (options.start == null || row > options.start) {
              if (!iter) {
                stream.emit('line', buff);
              } else {
                iter(null, buff);
              }
            }
            row++;
            buff = '';
          }
          return setTimeout(read, 1000);
        }

        var data = decode.write(buffer.slice(0, bytes));
        if (!iter) {
          stream.emit('data', data);
        }

        data = (buff + data).split(/\n+/);

        const l = data.length - 1;
        let i = 0;

        for (; i < l; i++) {
          // eslint-disable-next-line eqeqeq
          if (options.start == null || row > options.start) {
            if (!iter) {
              stream.emit('line', data[i]);
            } else {
              iter(null, data[i]);
            }
          }
          row++;
        }

        buff = data[l];
        pos += bytes;
        return read();
      });
    }());
  });

  if (!iter) {
    return stream;
  }

  return stream.destroy;
};
