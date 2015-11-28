'use strict';

/**
 * Helper function that performs a pipe-chain
 * but then returns the FIRST item in the pipe
 * chain so that it can be written to later.
 */
module.exports = function chain() {
  var formats = Array.from(arguments),
      head = formats.shift(),
      last = head;

  formats.forEach(function (format) {
    last = last.pipe(format);
  });

  return head;
};
