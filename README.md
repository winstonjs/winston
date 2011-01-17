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

There also seemed to be a log of libraries out there that were coupling their implementation of logging (i.e. where the logs to) to the API that they exposed to the programmer. This library aims to decouple those parts of the process to make it more flexible and extensible.

## Supported Transports
1. Console
2. Files
3. Riak
4. Loggly

## Usage

## Adding Custom Logging Transports

## Inspirations
1. [npm](https://github.com/isaacs/npm/blob/master/lib/utils/log.js)
2. [log.js](https://github.com/visionmedia/log.js)
3. [socket.io](http://socket.io)
4. [node-rlog](https://github.com/jbrisbin/node-rlog)
5. [BigBrother](https://github.com/feisty/BigBrother)

## Road Map
1. Make levels configurable for user preference (npm-style, syslog-style, etc)
2. Improve support for adding custom Transports not defined in Winston core.
3. Create API for reading from logs across all transports.  
4. Add more transports and make existing transports more robust:
  a. Riak
  b. CouchDB
  c. Redis

## Run Tests
All of the winston tests are written in [vows][1], and cover all of the use cases described above. You will need to add valid credentials for the various transports included to test/test-config.json before running tests:
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

[1]: http://vowsjs.org