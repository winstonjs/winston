# winston

A multi-transport async logging library for node.js.

### "CHILL WINSTON!" ... I put it in the logs.

## Installation

### Installing npm (node package manager)
<pre>
  curl http://npmjs.org/install.sh | sh
</pre>

### Installing winston
<pre>
  [sudo] npm install winston
</pre>

## Motivation
Winston is designed to be a simple and universal logging library with support for multiple transports. A transport is essentially a storage device for your logs. Each instance of the winston logger can have multiple transports configured at different levels. For example, one may want error logs to be stored in a persistent remote location (like a database), but all logs output to the console or a local file. 

There also seemed to be a log of libraries out there that were coupling their implementation of logging (i.e. how the logs are stored / indexed) to the API that they exposed to the programmer. This library aims to decouple those parts of the process to make it more flexible and extensible.

## Usage
There are two different ways to use winston: directly via the default logger, or by instantiating your own Logger. The former is merely intended to be a convenient shared logger to use throughout your application if you so choose. 

### Using the Default Logger
The default logger is accessible through the winston module directly. Any method that you could call on an instance of a logger is available on the default logger:
<pre>
  var winston = require('winston');
  
  winston.log('info', 'Hello distributed log files!');
  winston.info('Hello again distributed logs');
</pre>

By default, only the Console transport is set on the default logger. You can add or remove transports via the add() and remove() methods:
<pre>
  winston.add(winston.transports.File, { filename: 'somefile.log' });
  winston.remove(winston.transports.Console);
</pre> 

For more documenation about working with each individual transport supported by Winston see the "Working with Transports" section below. 

### Instantiating your own Logger
If you would prefer to manage the object lifetime of loggers you are free to instantiate them yourself:
<pre>
  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'somefile.log' })
    ]
  });
</pre>

You can work with this logger in the same way that you work with the default logger: 
<pre>
  //
  // Logging
  //
  logger.log('info', 'Hello distributed log files!');
  logger.info('Hello again distributed logs');
  
  //
  // Adding / Removing Transports
  //
  logger.add(winston.transports.Riak)
        .remove(winston.transports.Console);
</pre>

### Events and Callbacks in Winston

### Using Logging Levels
Setting the level for your logging message can be accomplished in one of two ways. You can pass a string representing the logging level to the log() method or use the level specified methods defined on every winston Logger. 
<pre>
  //
  // Any logger instance
  //
  logger.log('info', '127.0.0.1 - there's no place like home');
  logger.info('127.0.0.1 - there's no place like home');
  
  //
  // Default logger
  //
  winston.log('info', '127.0.0.1 - there's no place like home');
  winston.info('127.0.0.1 - there's no place like home');
</pre>

Currently, winston only supports [npm][2] style logging levels, but it is on the roadmap to support customizable logging levels. 
<pre>
  // TODO: Make levels configurable
  var levels = Logger.prototype.levels = {
    silly: 0, 
    verbose: 1, 
    info: 2, 
    warn: 3,
    debug: 4, 
    error: 5
  };
</pre>

## Working with Transports
Right now there are four transports supported by winston core. If you have a transport you would like to add either open an issue or fork and submit a pull request. Pull requests will not be accepted without associated tests.
   
1. __Console:__ Output to the terminal
2. __Files:__ Append to a file
3. __Riak:__ Log to a remote Riak server
4. __Loggly:__ Log to Logging-as-a-Service platform Loggly

### Console Transport

### File Transport

### Riak Transport

### Loggly Transport

### Adding Custom Transports

## What's Next?
Winston is stable and under active development. It is supported by and used at [Nodejitsu][1]. 

### Inspirations
1. [npm][2]
2. [log.js](https://github.com/visionmedia/log.js)
3. [socket.io](http://socket.io)
4. [node-rlog](https://github.com/jbrisbin/node-rlog)
5. [BigBrother](https://github.com/feisty/BigBrother)

### Road Map
1. Make levels configurable for user preference (npm-style, syslog-style, etc)
2. Improve support for adding custom Transports not defined in Winston core.
3. Create API for reading from logs across all transports.  
4. Add more transports and make existing transports more robust:
  a. Riak
  b. CouchDB
  c. Redis

## Run Tests
All of the winston tests are written in [vows][3], and cover all of the use cases described above. You will need to add valid credentials for the various transports included to test/test-config.json before running tests:
<pre>
  {
    "transports": {
      "riak": { "debug": false },
      "loggly": {
        "subdomain": "your-subdomain",
        "inputToken": "really-long-token-you-got-from-loggly",
        "auth": {
          "username": "your-username",
          "password": "your-password"
        }
      }
    }
  }
</pre>

Once you have valid Rackspace credentials you can run tests with [vows][1]:
<pre>
  vows test/*-test.js --spec
</pre>

#### Author: [Charlie Robbins](http://twitter.com/indexzero)
#### Contributors: [Matthew Bergman](http://github.com/fotoverite)

[1]: http://nodejitsu.com
[2]: https://github.com/isaacs/npm/blob/master/lib/utils/log.js
[3]: http://vowsjs.org