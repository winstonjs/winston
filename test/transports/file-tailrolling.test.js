var assert = require('assert'),
    rimraf = require('rimraf'),
    fs = require('fs'),
    path = require('path'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers');
const asyncSeries = require('async/series');



const { MESSAGE, LEVEL } = require('triple-beam');



//
// Remove all log fixtures
//
function removeFixtures(done) {
  rimraf(path.join(__dirname, '..', 'fixtures', 'logs', 'testtailrollingfiles*'), done);
}



let tailrollTransport = null;

describe('winston/transports/file/tailrolling', function(){
  describe("An instance of the File Transport", function(){
    before(removeFixtures);
    after(removeFixtures);

    it('init logger AFTER cleaning up old files', function(){
	tailrollTransport = new winston.transports.File({
	  timestamp: false,
	  json: false,
	  filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testtailrollingfiles.log'),
	  maxsize: 4096,
	  maxFiles: 3,
	  tailable: true
	})
        .on('open', console.log)
    });

    it("and when passed more files than the maxFiles", function(done){
          let created = 0;
          let loggedTotal = 0;
   
          function data(ch, kb) {
            return String.fromCharCode(65 + ch).repeat(kb*1024 - 1);
          };

          function logKbytes(kbytes, txt) {
            const toLog = {};
	    toLog[MESSAGE] = data(txt, kbytes)
            tailrollTransport.log(toLog);
          }

          tailrollTransport.on('logged', function (info) {
            loggedTotal += info[MESSAGE].length + 1
            if (loggedTotal >= 14*1024) { // just over 3 x 4kb files
              return done();
            }

            if(loggedTotal % 4096 === 0) {
              created ++;
            }
            setTimeout(() => logKbytes(1, created), 100);
          });

          logKbytes(1, created);
       });

       it("should be 3 log files, base to maxFiles - 1", function () {
          var file, fullpath;
          for (var num = 0; num < 4; num++) {
            file = !num ? 'testtailrollingfiles.log' : 'testtailrollingfiles' + num + '.log';
            fullpath = path.join(__dirname, '..', 'fixtures', 'logs', file);

            if (num == 3) {
              return assert.ok(!fs.existsSync(fullpath));
            }

            assert.ok(fs.existsSync(fullpath));
          }
          
          return false;
        });

        it("should have files in correct order", function () {
          var file, fullpath, content;
          ['D', 'C', 'B'].forEach(function (letter, i) {
            file = !i ? 'testtailrollingfiles.log' : 'testtailrollingfiles' + i + '.log';
            content = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'logs', file), 'ascii');
            content = content.replace(/\s+/g, '');

            assert(content.match(new RegExp(letter, 'g'))[0].length, content.length);
          });
        });
    })
})

