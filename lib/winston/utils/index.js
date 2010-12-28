/*
 * index.js: Top-level include for Winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

//
// function clone (obj)
//   Helper method for deep cloning pure JSON objects
//   i.e. JSON objects that are either literals or objects (no Arrays, etc)
//
var clone = exports.clone = function (obj) {
  var clone = {};
  for (var i in obj) {
    clone[i] = obj[i] instanceof Object ? interns.clone(obj[i]) : obj[i];
  }

  return clone;
};