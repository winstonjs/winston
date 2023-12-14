const assume = require('assume');
const mocha = require('mocha');

const helpers = require('.');
const winston = require('../../lib/winston');

module.exports = function ({ getAllInfo, helper, listener, name, setup, toggleSetting, trigger }) {
  before(function () {
    /*
     * This is an awful and fragile hack that
     * needs to be changed ASAP.
     * https://github.com/mochajs/mocha/issues/1985
     */
    var _runTest = this.originalRunTest = mocha.Runner.prototype.runTest;

    mocha.Runner.prototype.runTest = function () {
      this.allowUncaught = true;
      _runTest.apply(this, arguments);
    };
  });

  after(function () {
    mocha.Runner.prototype.runTest = this.originalRunTest;
  });

  it('has expected methods', function () {
    var handler = helpers[helper]();
    assume(handler.handle).is.a('function');
    assume(handler.unhandle).is.a('function');
    assume(handler.getAllInfo).is.a('function');
    assume(handler.getProcessInfo).is.a('function');
    assume(handler.getOsInfo).is.a('function');
    assume(handler.getTrace).is.a('function');
  });

  it(`new ${name}()`, function () {
    assume(function () {
      // eslint-disable-next-line no-new
      new winston[name]();
    }).throws(/Logger is required/);
  });

  it(`new ${name}(logger)`, function () {
    var logger = winston.createLogger();
    var handler = new winston[name](logger);
    assume(handler.logger).equals(logger);
  });

  it('.getProcessInfo()', function () {
    var handler = helpers[helper]();
    helpers.assertProcessInfo(handler.getProcessInfo());
  });

  it('.getOsInfo()', function () {
    var handler = helpers[helper]();
    helpers.assertOsInfo(handler.getOsInfo());
  });

  it('.getTrace(new Error)', function () {
    var handler = helpers[helper]();
    helpers.assertTrace(handler.getTrace(new Error()));
  });

  it('.getTrace()', function () {
    var handler = helpers[helper]();
    helpers.assertTrace(handler.getTrace());
  });

  it('.getAllInfo(undefined)', function () {
    var handler = helpers[helper]();
    // eslint-disable-next-line no-undefined
    handler.getAllInfo(getAllInfo);
  });

  describe('when error case is triggered', function () {
    beforeEach(function () {
      this.listeners = helpers[setup]();
    });

    afterEach(function () {
      this.listeners.restore();
    });

    it('.handle()', function (done) {
      var msg = new Date().toString();
      var writeable = helpers.writeable(function (info) {
        console.log('in writeable', info);
        assume(info).is.an('object');
        assume(info.error).is.an('error');
        assume(info.error.message).equals(msg);
        assume(info.message).includes(`${listener}: ${msg}`);
        assume(info.stack).is.a('string');
        assume(info.process).is.an('object');
        assume(info.os).is.an('object');
        assume(info.trace).is.an('array');

        done();
      });

      var transport = new winston.transports.Stream({ stream: writeable });
      var handler = helpers[helper]({
        exitOnError: false,
        transports: [transport]
      });

      assume(handler.catcher).is.a('undefined');

      transport[toggleSetting] = true;
      handler.handle();

      assume(handler.catcher).is.a('function');
      assume(process.listeners(listener)).deep.equals([
        handler.catcher
      ]);

      trigger(msg);
    });
  });
};
