var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers');

var filenameParams = [
  {basename: 'testtailrollingfiles', appendBaseName: 'testtailrollingfiles', desc: ''},
  {basename: 'testtailrollingnumfiles0', appendBaseName: 'testtailrollingnumfiles0.', desc: ' with tailing-number file names'}
];

var batch = {};
filenameParams.forEach(function(params) {
  var basename = params.basename;
  var appendBaseName = params.appendBaseName;

  var maxfilesTransport = new winston.transports.File({
    timestamp: false,
    json: false,
    filename: path.join(__dirname, '..', 'fixtures', 'logs', basename + '.log'),
    maxsize: 4096,
    maxFiles: 3,
    tailable: true
  });

  process.on('uncaughtException', function (err) {
    console.log('caught exception');
    console.error(err);
  });
  batch["An instance of the File Transport" + params.desc] = {
    "when delete old test files": {
      topic: function () {
        var logs = path.join(__dirname, '..', 'fixtures', 'logs');
        fs.readdirSync(logs).forEach(function (file) {
          if (~file.indexOf(basename)) {
            fs.unlinkSync(path.join(logs, file));
          }
        });

        this.callback();
      },
      "and when passed more files than the maxFiles": {
        topic: function () {
          var that = this,
            created = 0;

          function data(ch) {
            return new Array(1018).join(String.fromCharCode(65 + ch));
          }

          function logKbytes(kbytes, txt) {
            //
            // With no timestamp and at the info level,
            // winston adds exactly 7 characters:
            // [info](4)[ :](2)[\n](1)
            //
            for (var i = 0; i < kbytes; i++) {
              maxfilesTransport.log('info', data(txt), null, function () { });
            }
          }

          maxfilesTransport.on('logged', function () {
            if (++created == 4) {
              return that.callback();
            }

            logKbytes(4, created);
          });

          logKbytes(4, created);
        },
        "should be 3 log files, base to maxFiles - 1": function () {
          var file, fullpath;
          for (var num = 0; num < 4; num++) {
            file = !num ? (basename  + '.log') : (appendBaseName + num + '.log');
            fullpath = path.join(__dirname, '..', 'fixtures', 'logs', file);

            if (num == 3) {
              return assert.ok(!fs.existsSync(fullpath));
            }

            assert.ok(fs.existsSync(fullpath));
          }

          return false;
        },
        "should have files in correct order": function () {
          var file, content;
          ['D', 'C', 'B'].forEach(function (letter, i) {
            file = !i ? (basename + '.log') : (appendBaseName + i + '.log');
            content = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'logs', file), 'ascii');

            assert.lengthOf(content.match(new RegExp(letter, 'g')), 4068);
          });
        }
      }
    }
  };
});

vows.describe('winston/transports/file/tailrolling').addBatch(batch).export(module);