var winston = require('../lib/winston');
var fs = require('fs');

/**
	Create a logger with log rolling support with 
	interval of 5 seconds (increase  this if you in production)
	maxsize of 20 KB (maximum size of the log file)
*/

var logger = new (winston.Logger)({
transports: [
  new (winston.transports.Fileroller)({ filename: 'somefile.log', interval:1000 * 5, maxsize: 5 * 1000 })
]
});

//see the directory for logs have been rolling
setInterval(function() {
	logger.info("The logging here");
}, 60);

fs.watchFile('./somefile.log', function(curr) {
	console.log('logger size: %s bytes', curr.size);
});


