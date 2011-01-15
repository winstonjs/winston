/*
 * console.js: Transport for outputting to the console
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    colors = require('colors');

var months = ['Jan', 'Feb', 'Mar', 'Apr', 
              'May', 'Jun', 'Jul', 'Aug', 
              'Sep', 'Oct', 'Nov', 'Dec'];

//
// Borrowed from node.js core because I wanted a universal lowercase header message
//
function pad (n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

//
// Borrowed from node.js core because I wanted a universal lowercase header message
//
function timestamp () {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

var Console = exports.Console = function (options) {
  options = options || {};
  
  // TODO: Consume the colorize option
  this.silent = options.silent || false;
  this.timestamp = options.timestamp || true;
  this.colorize = options.colorize;
};

Console.prototype.log = function (level, msg, meta, callback) {
  if (!this.silent) {
    var output = this.timestamp ? timestamp() + ' - ' : '';
    output += level + ': ' + msg;
    
    // TODO: Define color profile for eyes
    if (meta && Object.keys(meta).length > 0) output += ' ' + util.inspect(meta);
    
    if (level === 'error' || level === 'debug') {
      util.error(output);
    }
    else {
      util.puts(output);
    }
  }
  
  callback(null, true);
};