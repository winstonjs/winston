'use strict';

const assume = require('assume');
const { Writable } = require('stream');
const { MESSAGE } = require('triple-beam');
const { config, createLogger, format, transports } = require('../../../../lib/winston');

const SYSLOG_ONLY_LEVELS = ['emerg', 'alert', 'crit', 'warning', 'notice'];
const SHARED_LEVELS = ['error', 'info'];

function captureCliMessages(levels, levelNames) {
  return new Promise((resolve) => {
    const messages = [];
    const transport = new transports.Stream({
      format: format.cli(),
      stream: new Writable({
        objectMode: true,
        write(info, encoding, callback) {
          messages.push(info[MESSAGE]);
          callback();
        }
      })
    });

    const logger = createLogger({
      levels,
      level: "debug",
      transports: [transport]
    });

    transport.on("logged", () => {
      if (messages.length === levelNames.length) {
        resolve(messages);
      }
    });

    levelNames.forEach((level) => {
      logger[level]("Hello World!");
    });
  });
}

function assertHelloWithoutUndefined(message, level) {
  assume(message).is.a("string");
  assume(message).includes("Hello World!");
  assume(message).includes(level);
  assume(message.includes("undefined")).equals(false);
}

describe("format.cli() with syslog levels (#2477)", function () {
  it("does not prepend undefined for emerg, alert, crit, warning, notice", async function () {
    const messages = await captureCliMessages(
      config.syslog.levels,
      SYSLOG_ONLY_LEVELS
    );

    assume(messages).length(SYSLOG_ONLY_LEVELS.length);
    messages.forEach((message, i) => {
      assertHelloWithoutUndefined(message, SYSLOG_ONLY_LEVELS[i]);
    });
  });

  it("still formats syslog error and info without undefined", async function () {
    const messages = await captureCliMessages(
      config.syslog.levels,
      SHARED_LEVELS
    );

    assume(messages).length(SHARED_LEVELS.length);
    messages.forEach((message, i) => {
      assertHelloWithoutUndefined(message, SHARED_LEVELS[i]);
    });
  });

  it("still formats default error and info", async function () {
    const messages = await captureCliMessages(undefined, SHARED_LEVELS);
    assume(messages).length(SHARED_LEVELS.length);
    messages.forEach((message, i) => {
      assertHelloWithoutUndefined(message, SHARED_LEVELS[i]);
    });
  });
});
