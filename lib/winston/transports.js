/*
 * transports.js: Set of all transports Winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var fs = require('fs'),
    path = require('path');

var transports = exports;

function capitalize (str) {
  return str && str[0].toUpperCase() + str.slice(1);
};

//
// Setup all transports as lazy-loaded getters.
//
fs.readdirSync(path.join(__dirname, 'transports')).forEach(function (file) {
  var transport = file.replace('.js', ''),
      name  = capitalize(transport);
      
  transports.__defineGetter__(name, function () {
    return require('./transports/' + transport)[name];
  });
});