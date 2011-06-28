# winston

A multi-transport async logging library for node.js. <span style="font-size:28px; font-weight:bold;">&quot;CHILL WINSTON! ... I put it in the logs.&quot;</span>

## Installation

### Installing npm (node package manager)
```
  curl http://npmjs.org/install.sh | sh
```

### Installing winston
```
  [sudo] npm install winston
```

## Motivation
Winston is designed to be a simple and universal logging library with support for multiple transports. A transport is essentially a storage device for your logs. Each instance of a winston logger can have multiple transports configured at different levels. For example, one may want error logs to be stored in a persistent remote location (like a database), but all logs output to the console or a local file. 

There also seemed to be a lot of logging libraries out there that coupled their implementation of logging (i.e. how the logs are stored / indexed) to the API that they exposed to the programmer. This library aims to decouple those parts of the process to make it more flexible and extensible.

## Usage
There are two different ways to use winston: directly via the default logger, or by instantiating your own Logger. The former is merely intended to be a convenient shared logger to use throughout your application if you so choose. 

### Using the Default Logger
The default logger is accessible through the winston module directly. Any method that you could call on an instance of a logger is available on the default logger:

``` js
  var winston = require('winston');
  
  winston.log('info', 'Hello distributed log files!');
  winston.info('Hello again distributed logs');
```

By default, only the Console transport is set on the default logger. You can add or remove transports via the add() and remove() methods:

``` js
  winston.add(winston.transports.File, { filename: 'somefile.log' });
  winston.remove(winston.transports.Console);
```

For more documenation about working with each individual transport supported by Winston see the "Working with Transports" section below. 

### Instantiating your own Logger
If you would prefer to manage the object lifetime of loggers you are free to instantiate them yourself:

``` js
  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'somefile.log' })
    ]
  });
```

You can work with this logger in the same way that you work with the default logger: 

``` js
  //
  // Logging
  //
  logger.log('info', 'Hello distributed log files!');
  logger.info('Hello again distributed logs');
  
  //
  // Adding / Removing Transports
  //   (Yes It's chainable)
  //
  logger.add(winston.transports.File)
        .remove(winston.transports.Console);
```

### Using Logging Levels
Setting the level for your logging message can be accomplished in one of two ways. You can pass a string representing the logging level to the log() method or use the level specified methods defined on every winston Logger. 

``` js
  //
  // Any logger instance
  //
  logger.log('info', "127.0.0.1 - there's no place like home");
  logger.info("127.0.0.1 - there's no place like home");
  
  //
  // Default logger
  //
  winston.log('info', "127.0.0.1 - there's no place like home");
  winston.info("127.0.0.1 - there's no place like home");
```

As of 0.2.0, winston supports customizable logging levels, defaulting to [npm][0] style logging levels. Changing logging levels is easy:

``` js
  //
  // Change levels on the default winston logger
  //
  winston.setLevels(winston.config.syslog.levels);
  
  //
  // Change levels on an instance of a logger
  //
  logger.setLevels(winston.config.syslog.levels);
```

Calling `.setLevels` on a logger will remove all of the previous helper methods for the old levels and define helper methods for the new levels. Thus, you should be careful about the logging statements you use when changing levels. For example, if you ran this code after changing to the syslog levels:

``` js
  //
  // Logger does not have 'silly' defined since that level is not in the syslog levels 
  //
  logger.silly('some silly message');
```

### Using Custom Logging Levels
In addition to the predefined `npm` and `syslog` levels available in Winston, you can also choose to define your own:

``` js
  var myCustomLevels = {
    levels: {
      foo: 0,
      bar: 1,
      baz: 2,
      foobar: 3
    },
    colors: {
      foo: 'blue',
      bar: 'green',
      baz: 'yellow',
      foobar: 'red'
    }
  };
  
  var customLevelLogger = new (winston.Logger)({ levels: myCustomLevels.levels }); 
  customLevelLogger.foobar('some foobar level-ed message');
```

Although there is slight repetition in this data structure, it enables simple encapsulation if you not to have colors. If you do wish to have colors, in addition to passing the levels to the Logger itself, you must make winston aware of them:

``` js
  //
  // Make winston aware of these colors
  //
  winston.addColors(myCustomLevels.colors);
```

This enables transports with the 'colorize' option set to appropriately color the output of custom levels.

### Events and Callbacks in Winston
Each instance of winston.Logger is also an instance of an [EventEmitter][1]. A log event will be raised each time a transport successfully logs a message:

``` js
  logger.on('log', function (transport, level, msg, meta) {
    // [msg] and [meta] have now been logged at [level] to [transport]
  });
  
  logger.info('CHILL WINSTON!', { seriously: true });
```

It is also worth mentioning that the logger also emits an 'error' event which you should handle or suppress if you don't want unhandled exceptions:

``` js
  //
  // Handle errors
  //
  logger.on('error', function (err) { /* Do Something */ });
  
  //
  // Or just suppress them.
  //
  logger.emitErrs = false;
```

Every logging method described in the previous section also takes an optional callback which will be called only when all of the transports have logged the specified message.

``` js
  logger.info('CHILL WINSTON!', { seriously: true }, function (err, level, msg, meta) {
    // [msg] and [meta] have now been logged at [level] to **every** transport.
  });
```

### Logging with Metadata
In addition to logging string messages, winston will also optionally log additional JSON metadata objects. Adding metadata is simple:

``` js
  winston.log('info', 'Test Log Message', { anything: 'This is metadata' });
```

The way these objects is stored varies from transport to transport (to best support the storage mechanisms offered). Here's a quick summary of how each transports handles metadata:

1. __Console:__ Logged via util.inspect(meta)
2. __File:__ Logged via util.inspect(meta)
3. __Loggly:__ Logged in suggested [Loggly format][2]

### Profiling with Winston
In addition to logging messages and metadata, winston also has a simple profiling mechanism implemented for any logger:

``` js
  //
  // Start profile of 'test'
  // Remark: Consider using Date.now() with async operations 
  //
  winston.profile('test');
  
  setTimeout(function () {
    //
    // Stop profile of 'test'. Logging will now take place:
    //   "17 Jan 21:00:00 - info: test duration=1000ms"
    //
    winston.profile('test');
  }, 1000);
``` 

All profile messages are set to the 'info' by default and both message and metadata are optional There are no plans in the Roadmap to make this configurable, but I'm open to suggestions / issues.

### Using winston in a CLI tool
A common use-case for logging is output to a CLI tool. Winston has a special helper method which will pretty print output from your CLI tool. Here's an example from the [require-analyzer][15] written by [Nodejitsu][5]:

```
  info:   require-analyzer starting in /Users/Charlie/Nodejitsu/require-analyzer
  info:   Found existing dependencies
  data:   {
  data:     colors: '0.x.x',
  data:     eyes: '0.1.x',
  data:     findit: '0.0.x',
  data:     npm: '1.0.x',
  data:     optimist: '0.2.x',
  data:     semver: '1.0.x',
  data:     winston: '0.2.x'
  data:   }
  info:   Analyzing dependencies...
  info:   Done analyzing raw dependencies
  info:   Retrieved packages from npm
  warn:   No additional dependencies found
```

Configuring output for this style is easy, just use the `.cli()` method on `winston` or an instance of `winston.Logger`:

``` js
  var winston = require('winston');
  
  //
  // Configure CLI output on the default logger
  //
  winston.cli();
  
  //
  // Configure CLI on an instance of winston.Logger
  //
  var logger = new winston.Logger({
    transports: [
      new (winston.transports.Console)()
    ]
  });
  
  logger.cli();
```

### Extending another object with Logging functionality
Often in a given code base with lots of Loggers it is useful to add logging methods a different object so that these methods can be called with less syntax. Winston exposes this functionality via the 'extend' method:

``` js
  var myObject = {};
  
  logger.extend(myObject);
  
  //
  // You can now call logger methods on 'myObject'
  //
  myObject.info('127.0.0.1 - there's no place like home');
```

## Working with Transports
Right now there are four transports supported by winston core. If you have a transport you would like to add either open an issue or fork and submit a pull request. Commits are welcome, but I'll give you extra street cred if you __add tests too :D__
   
1. __Console:__ Output to the terminal
2. __Files:__ Append to a file
3. __Loggly:__ Log to Logging-as-a-Service platform Loggly

### Console Transport
``` js
  winston.add(winston.transports.Console, options)
```

The Console transport takes two simple options:

* __level:__ Level of messages that this transport should log.
* __silent:__ Boolean flag indicating whether to suppress output
* __colorize:__ Boolean flag indicating if we should colorize output.

*Metadata:* Logged via util.inspect(meta);

### File Transport
``` js
  winston.add(winston.transports.File, options)
```

The File transport should really be the 'Stream' transport since it will accept any [WritableStream][14]. It is named such because it will also accept filenames via the 'filename' option:

* __level:__ Level of messages that this transport should log.
* __silent:__ Boolean flag indicating whether to suppress output.
* __colorize:__ Boolean flag indicating if we should colorize output.
* __filename:__ The filename of the logfile to write output to.
* __stream:__ The WriteableStream to write output to.

*Metadata:* Logged via util.inspect(meta);

### Loggly Transport
``` js
  winston.add(winston.transports.Loggly, options);
```

The Loggly transport is based on [Nodejitsu's][5] [node-loggly][6] implementation of the [Loggly][7] API. If you haven't heard of Loggly before, you should probably read their [value proposition][8]. The Loggly transport takes the following options. Either 'inputToken' or 'inputName' is required:

* __level:__ Level of messages that this transport should log. 
* __subdomain:__ The subdomain of your Loggly account. *[required]*
* __auth__: The authentication information for your Loggly account. *[required with inputName]*
* __inputName:__ The name of the input this instance should log to.
* __inputToken:__ The input token of the input this instance should log to.

*Metadata:* Logged in suggested [Loggly format][2]

### Riak Transport
As of `0.3.0` the Riak transport has been broken out into a new module: [winston-riak][17]. Using it is just as easy:

``` js
  var Riak = require('winston-riak').Riak;
  winston.add(Riak, options);
```

In addition to the options accepted by the [riak-js][3] [client][4], the Riak transport also accepts the following options. It is worth noting that the riak-js debug option is set to *false* by default:

* __level:__ Level of messages that this transport should log.
* __bucket:__ The name of the Riak bucket you wish your logs to be in or a function to generate bucket names dynamically.

``` js
  // Use a single bucket for all your logs
  var singleBucketTransport = new (Riak)({ bucket: 'some-logs-go-here' });
  
  // Generate a dynamic bucket based on the date and level
  var dynamicBucketTransport = new (Riak)({
    bucket: function (level, msg, meta, now) {
      var d = new Date(now);
      return level + [d.getDate(), d.getMonth(), d.getFullYear()].join('-');
    }
  });
```

*Metadata:* Logged as JSON literal in Riak

### MongoDB Transport
As of `0.3.0` the MongoDB transport has been broken out into a new module: [winston-mongodb][16]. Using it is just as easy:

``` js
  var MongoDB = require('winston-mongoDB').MongoDB;
  winston.add(MongoDB, options);
```

The MongoDB transport takes the following options. 'db' is required:

* __level:__ Level of messages that this transport should log. 
* __silent:__ Boolean flag indicating whether to suppress output.
* __db:__ The name of the database you want to log to. *[required]*
* __collection__: The name of the collection you want to store log messages in, defaults to 'log'.
* __safe:__ Boolean indicating if you want eventual consistency on your log messages, if set to true it requires an extra round trip to the server to ensure the write was committed, defaults to true.
* __host:__ The host running MongoDB, defaults to localhost.
* __port:__ The port on the host that MongoDB is running on, defaults to MongoDB's default port.

*Metadata:* Logged as a native JSON object.

### Adding Custom Transports
Adding a custom transport (say for one of the datastore on the Roadmap) is actually pretty easy. All you need to do is accept a couple of options, set a name, implement a log() method, and add it to the set of transports exposed by winston.

``` js
  var winston = require('winston');
  
  var CustomLogger = winston.transports.CustomerLogger = function (options) {
    //
    // Name this logger
    //
    this.name = 'customLogger';
    
    //
    // Set the level from your options
    //
    this.level = options.level || 'info';
    
    //
    // Configure your storage backing as you see fit
    //
  };
  
  CustomLogger.prototype.log = function (level, msg, meta, callback) {
    //
    // Store this message and metadata, maybe use some custom logic
    // then callback indicating success.
    //
    callback(null, true); 
  };
```

## What's Next?
Winston is stable and under active development. It is supported by and used at [Nodejitsu][5]. 

### Inspirations
1. [npm][0]
2. [log.js][9]
3. [socket.io][10]
4. [node-rlog][11]
5. [BigBrother][12]
6. [Loggly][7]

### Road Map
1. Graylog2 format support.
2. Improve support for adding custom Transports not defined in Winston core.
3. Create API for reading from logs across all transports.  
4. Add more transports: Redis

## Run Tests
All of the winston tests are written in [vows][13], and cover all of the use cases described above. You will need to add valid credentials for the various transports included to test/test-config.json before running tests:

``` js
  {
    "transports": {
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
```

Once you have valid configuration and credentials you can run tests with [vows][13]:

```
  vows test/*-test.js --spec
```

#### Author: [Charlie Robbins](http://twitter.com/indexzero)
#### Contributors: [Matthew Bergman](http://github.com/fotoverite), [Marak Squires](http://github.com/marak)

[0]: https://github.com/isaacs/npm/blob/master/lib/utils/log.js
[1]: http://nodejs.org/docs/v0.3.5/api/events.html#events.EventEmitter
[2]: http://wiki.loggly.com/loggingfromcode
[3]: http://riakjs.org
[4]: https://github.com/frank06/riak-js/blob/master/src/http_client.coffee#L10
[5]: http://nodejitsu.com
[6]: http://github.com/nodejitsu/node-loggly
[7]: http://loggly.com
[8]: http://www.loggly.com/product/
[9]: https://github.com/visionmedia/log.js
[10]: http://socket.io
[11]: https://github.com/jbrisbin/node-rlog
[12]: https://github.com/feisty/BigBrother
[13]: http://vowsjs.org
[14]: http://nodejs.org/docs/v0.3.5/api/streams.html#writable_Stream
[15]: http://github.com/nodejitsu/require-analyzer
[16]: http://github.com/indexzero/winston-mongodb
[17]: http://github.com/indexzero/winston-riak