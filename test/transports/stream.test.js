'use strict';

var path = require('path'),
    winston = require('../../'),
    helpers = require('../helpers'),
    fs = require('fs'),
    split = require('split2'),
    assume = require('assume');

describe('Stream({ stream })', function () {
  it('should support objectMode streams');
  it('should support UTF8 encoding streams');
  it('should throw when not passed a stream');
});
