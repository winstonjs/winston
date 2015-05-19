/**
	* This is a visual test. You have to look in the console to confirm only expected output is emitted.
*/
'use strict';
var winston = require('../lib/winston');

//winston.default.transports.console.colorize = true;
//winston.default.transports.console.levelOnly = false;
//winston.default.transports.console.level = 'info';//should log only warn and error

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	level: 'info',
	levelOnly: false,
	colorize: true,
	'timestamp': function() {
		return (new Date());
	}
});

var refErr = new ReferenceError('This is bad');
var fn = function(){
	try{
		winston.silly('---some silly we need to log - should not log this---');// should not log this
		winston.debug('---some debug we need to log - should not log this---');// should not log this
		winston.info('---some info we need to log - should not log this---');// should not log this
		winston.warn('some warn we need to log');
		winston.error('some error we need to log');
	} catch(e) {
		throw refErr;
	}
};
console.log('_____ First Test _____');
fn();


// winston.default.transports.console.levelOnly = true;
// winston.default.transports.console.level = 'debug';//should log only debug

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	level: 'debug',
	levelOnly: true,
	colorize: true,
	'timestamp': function() {
		return (new Date());
	}
});

var refErr = new ReferenceError('This is bad');
var fn = function(){
	try{
		winston.silly('---some silly we need to log - should not log this---');// should not log this
		winston.debug('some debug we need to log');
		winston.info('---some info we need to log - should not log this---');// should not log this
		winston.warn('---some warn we need to log - should not log this---');// should not log this
		winston.error('---some error we need to log - should not log this---');// should not log this
	} catch(e) {
		throw refErr;
	}
};
console.log('_____ Second Test _____');
fn();