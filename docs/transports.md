# Winston Transports

In `winston` a transport is essentially a storage device for your logs. Each
instance of a winston logger can have multiple transports configured at
different levels. For example, one may want error logs to be stored in a
persistent remote location (like a database), but all logs output to the
console or a local file.

There are several [core transports](#built-in-to-winston) included in `winston`
that leverage the built-in networking and file I/O offered by Node.js core. In
addition, there are transports which are [actively supported by winston
contributors](#maintained-by-winston-contributors). And last (but not least)
there are additional transports written by 
[members of the community](#community-transports).

> Additionally there are transports previously maintained by winston
> contributors that are [looking for maintainers](#looking-for-maintainers). 

* **[Built-in to winston](#built-in-to-winston)**
  * [Console](#console-transport)
  * [File](#file-transport)
  * [Http](#http-transport)
  * [Stream](#stream-transport)

* **[Maintained by winston contributors](#maintained-by-winston-contributors)**
  * [DailyRotateFile](#dailyrotatefile-transport)
  * [MongoDB](#mongodb-transport)
  * [Syslog](#syslog-transport)

* **[Community Transports](#community-transports)**
  * [Airbrake](#airbrake-transport)
  * [Amazon CloudWatch](#amazon-cloudwatch-transport)
  * [Amazon DynamoDB](#amazon-dynamodb-transport)
  * [Amazon Kinesis Firehose](#amazon-kinesis-firehose-transport)
  * [Amazon SNS](#amazon-sns-simple-notification-system-transport)
  * [Azure Table](#azure-table)
  * [Cassandra](#cassandra-transport)
  * [Cisco Spark](#cisco-spark-transport)
  * [Cloudant](#cloudant)
  * [Datadog](#datadog-transport)
  * [Elasticsearch](#elasticsearch-transport)
  * [FastFileRotate](#fastfilerotate-transport)
  * [Google BigQuery](#google-bigquery)
  * [Google Stackdriver Logging](#google-stackdriver-transport)
  * [Graylog2](#graylog2-transport)
  * [Humio](#humio-transport)
  * [LogDNA](#logdna-transport)
  * [Logsene](#logsene-transport) (including Log-Alerts and Anomaly Detection)
  * [Logz.io](#logzio-transport)
  * [Mail](#mail-transport)
  * [Newrelic](#newrelic-transport) (errors only)
  * [Papertrail](#papertrail-transport)
  * [PostgresQL](#postgresql-transport)
  * [Pusher](#pusher-transport)
  * [Sentry](#sentry-transport)
  * [SimpleDB](#simpledb-transport)
  * [Slack](#slack-transport)
  * [SQLite3](#sqlite3-transport)
  * [SSE with KOA 2](#sse-transport-with-koa-2)
  * [Sumo Logic](#sumo-logic-transport)
  * [Winlog2 Transport](#winlog2-transport)

* **[Looking for maintainers](#looking-for-maintainers)**
  * [CouchDB](#couchdb-transport)
  * [Loggly](#loggly-transport)
  * [Redis](#redis-transport)
  * [Riak](#riak-transport)

## Built-in to winston

There are several core transports included in `winston`, which leverage the built-in networking and file I/O offered by Node.js core.

* [Console](#console-transport)
* [File](#file-transport)
* [Http](#http-transport)
* [Stream](#stream-transport)

### Console Transport

``` js
logger.add(new winston.transports.Console(options));
```

The Console transport takes a few simple options:

* __level:__ Level of messages that this transport should log (default: level set on parent logger).
* __silent:__ Boolean flag indicating whether to suppress output (default false).
* __eol:__ string indicating the end-of-line characters to use (default `os.EOL`)
* __stderrLevels__ Array of strings containing the levels to log to stderr instead of stdout, for example `['error', 'debug', 'info']`. (default `[]`)
* __consoleWarnLevels__ Array of strings containing the levels to log using console.warn or to stderr (in Node.js) instead of stdout, for example `['warn', 'debug']`. (default `[]`)

### File Transport
``` js
logger.add(new winston.transports.File(options));
```

The File transport supports a variety of file writing options. If you are
looking for daily log rotation see [DailyRotateFile](#dailyrotatefile-transport)

* __level:__ Level of messages that this transport should log (default: level set on parent logger).
* __silent:__ Boolean flag indicating whether to suppress output (default false).
* __eol:__ Line-ending character to use. (default: `os.EOL`).
* __filename:__ The filename of the logfile to write output to.
* __maxsize:__ Max size in bytes of the logfile, if the size is exceeded then a new file is created, a counter will become a suffix of the log file.
* __maxFiles:__ Limit the number of files created when the size of the logfile is exceeded.
* __tailable:__ If true, log files will be rolled based on maxsize and maxfiles, but in ascending order. The __filename__ will always have the most recent log lines. The larger the appended number, the older the log file.  This option requires __maxFiles__ to be set, or it will be ignored.
* __maxRetries:__ The number of stream creation retry attempts before entering a failed state. In a failed state the transport stays active but performs a NOOP on it's log function. (default 2)
* __zippedArchive:__ If true, all log files but the current one will be zipped.
* __options:__ options passed to `fs.createWriteStream` (default `{flags: 'a'}`).
* __stream:__ **DEPRECATED** The WriteableStream to write output to.

### Http Transport

``` js
logger.add(new winston.transports.Http(options));
```

The `Http` transport is a generic way to log, query, and stream logs from an arbitrary Http endpoint, preferably [winstond][1]. It takes options that are passed to the node.js `http` or `https` request:

* __host:__ (Default: **localhost**) Remote host of the HTTP logging endpoint
* __port:__ (Default: **80 or 443**) Remote port of the HTTP logging endpoint
* __path:__ (Default: **/**) Remote URI of the HTTP logging endpoint
* __auth:__ (Default: **None**) An object representing the `username` and `password` for HTTP Basic Auth
* __ssl:__ (Default: **false**) Value indicating if we should us HTTPS

### Stream Transport

``` js
logger.add(new winston.transports.Stream({
  stream: fs.createWriteStream('/dev/null')
  /* other options */
}));
```

The Stream transport takes a few simple options:

* __stream:__ any Node.js stream. If an `objectMode` stream is provided then
  the entire `info` object will be written. Otherwise `info[MESSAGE]` will be
  written.
* __level:__ Level of messages that this transport should log (default: level set on parent logger).
* __silent:__ Boolean flag indicating whether to suppress output (default false).
* __eol:__ Line-ending character to use. (default: `os.EOL`).

## Maintained by winston contributors

Starting with `winston@0.3.0` an effort was made to remove any transport which added additional dependencies to `winston`. At the time there were several transports already in `winston` which will have slowly waned in usage. The 
following transports are **actively maintained by members of the winston Github
organization.**

* [MongoDB](#mongodb-transport)
* [DailyRotateFile](#dailyrotatefile-transport)
* [Syslog](#syslog-transport)

### MongoDB Transport

As of `winston@0.3.0` the MongoDB transport has been broken out into a new module: [winston-mongodb][14]. Using it is just as easy:

``` js
const winston = require('winston');

/**
 * Requiring `winston-mongodb` will expose
 * `winston.transports.MongoDB`
 */
require('winston-mongodb');

logger.add(new winston.transports.MongoDB(options));
```

The MongoDB transport takes the following options. 'db' is required:

* __level:__ Level of messages that this transport should log, defaults to
'info'.
* __silent:__ Boolean flag indicating whether to suppress output, defaults to
false.
* __db:__ MongoDB connection uri, pre-connected db object or promise object
which will be resolved with pre-connected db object.
* __options:__ MongoDB connection parameters (optional, defaults to
`{poolSize: 2, autoReconnect: true}`).
* __collection__: The name of the collection you want to store log messages in,
defaults to 'log'.
* __storeHost:__ Boolean indicating if you want to store machine hostname in
logs entry, if set to true it populates MongoDB entry with 'hostname' field,
which stores os.hostname() value.
* __username:__ The username to use when logging into MongoDB.
* __password:__ The password to use when logging into MongoDB. If you don't
supply a username and password it will not use MongoDB authentication.
* __label:__ Label stored with entry object if defined.
* __name:__ Transport instance identifier. Useful if you need to create multiple
MongoDB transports.
* __capped:__ In case this property is true, winston-mongodb will try to create
new log collection as capped, defaults to false.
* __cappedSize:__ Size of logs capped collection in bytes, defaults to 10000000.
* __cappedMax:__ Size of logs capped collection in number of documents.
* __tryReconnect:__ Will try to reconnect to the database in case of fail during
initialization. Works only if __db__ is a string. Defaults to false.
* __expireAfterSeconds:__ Seconds before the entry is removed. Works only if __capped__ is not set.

*Metadata:* Logged as a native JSON object in 'meta' property.

*Logging unhandled exceptions:* For logging unhandled exceptions specify
winston-mongodb as `handleExceptions` logger according to winston documentation.

### DailyRotateFile Transport

See [winston-dailyrotatefile](https://github.com/winstonjs/winston-daily-rotate-file).

### Syslog Transport

See [winston-syslog](https://github.com/winstonjs/winston-syslog).

## Community Transports

The community has truly embraced `winston`; there are over **23** winston transports and over half of them are maintained by authors external to the winston core team. If you want to check them all out, just search `npm`:

``` bash
  $ npm search winston
```

**If you have an issue using one of these modules you should contact the module author directly**

### Airbrake Transport

[winston-airbrake2][22] is a transport for winston that sends your logs to Airbrake.io.

``` js
const winston = require('winston');
const { Airbrake } = require('winston-airbrake2');
logger.add(new Airbrake(options));
```

The Airbrake transport utilises the node-airbrake module to send logs to the Airbrake.io API. You can set the following options:

* __apiKey__: The project API Key. (required, default: null)
* __name__: Transport name. (optional, default: 'airbrake')
* __level__: The level of message that will be sent to Airbrake (optional, default: 'error')
* __host__: The information that is displayed within the URL of the Airbrake interface. (optional, default: 'http://' + os.hostname())
* __env__: The environment will dictate what happens with your message. If your environment is currently one of the 'developmentEnvironments', the error will not be sent to Airbrake. (optional, default: process.env.NODE_ENV)
* __timeout__: The maximum time allowed to send to Airbrake in milliseconds. (optional, default: 30000)
* __developmentEnvironments__: The environments that will **not** send errors to Airbrake. (optional, default: ['development', 'test'])
* __projectRoot__: Extra string sent to Airbrake. (optional, default: null)
* __appVersion__: Extra string or number sent to Airbrake. (optional, default: null)
* __consoleLogError__: Toggle the logging of errors to console when the current environment is in the developmentEnvironments array. (optional, default: false)

### Amazon CloudWatch Transport

The [winston-aws-cloudwatch][25] transport relays your log messages to Amazon CloudWatch.

```js
const winston = require('winston');
const AwsCloudWatch = require('winston-aws-cloudwatch');

logger.add(new AwsCloudWatch(options));
```

Options:

* __logGroupName:__ The name of the CloudWatch log group to which to log. *[required]*
* __logStreamName:__ The name of the CloudWatch log stream to which to log. *[required]*
* __awsConfig:__ An object containing your `accessKeyId`, `secretAccessKey`, `region`, etc.

Alternatively, you may be interested in [winston-cloudwatch][26].

### Amazon DynamoDB Transport
The [winston-dynamodb][36] transport uses Amazon's DynamoDB as a sink for log messages. You can take advantage of the various authentication methods supports by Amazon's aws-sdk module. See [Configuring the SDK in Node.js](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html).

``` js
const winston = require('winston');
const { DynamoDB } = require('winston-dynamodb');

logger.add(new DynamoDB(options));
```

Options:
* __accessKeyId:__ your AWS access key id
* __secretAccessKey:__ your AWS secret access key
* __region:__ the region where the domain is hosted
* __useEnvironment:__ use process.env values for AWS access, secret, & region.
* __tableName:__ DynamoDB table name

To Configure using environment authentication:
``` js
logger.add(new winston.transports.DynamoDB({
  useEnvironment: true,
  tableName: 'log'
});
```

Also supports callbacks for completion when the DynamoDB putItem has been completed.

### Amazon Kinesis Firehose Transport

The [winston-firehose][28] transport relays your log messages to Amazon Kinesis Firehose.

```js
const winston = require('winston');
const WFirehose = require('winston-firehose');

logger.add(new WFirehose(options));
```

Options:

* __streamName:__ The name of the Amazon Kinesis Firehose stream to which to log. *[required]*
* __firehoseOptions:__ The AWS Kinesis firehose options to pass direction to the firehose client, [as documented by AWS](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Firehose.html#constructor-property). *[required]*

### Amazon SNS (Simple Notification System) Transport

The [winston-sns][18] transport uses amazon SNS to send emails, texts, or a bunch of other notifications. Since this transport uses the Amazon AWS SDK for JavaScript, you can take advantage of the various methods of authentication found in Amazon's [Configuring the SDK in Node.js](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html) document.

``` js
const winston = require('winston');
const SnsTransport = require('winston-sns');

logger.add(new SnsTransport(options));
```

Options:

* __subscriber:__ Subscriber number - found in your SNS AWS Console, after clicking on a topic. Same as AWS Account ID. *[required]*
* __topic_arn:__ Also found in SNS AWS Console - listed under a topic as Topic ARN. *[required]*
* __aws_key:__ Your Amazon Web Services Key.
* __aws_secret:__ Your Amazon Web Services Secret.
* __region:__ AWS Region to use. Can be one of: `us-east-1`,`us-west-1`,`eu-west-1`,`ap-southeast-1`,`ap-northeast-1`,`us-gov-west-1`,`sa-east-1`. (default: `us-east-1`)
* __subject:__ Subject for notifications. Uses placeholders for level (%l), error message (%e), and metadata (%m). (default: "Winston Error Report")
* __message:__ Message of notifications. Uses placeholders for level (%l), error message (%e), and metadata (%m). (default: "Level '%l' Error:\n%e\n\nMetadata:\n%m")
* __level:__ lowest level this transport will log. (default: `info`)
* __json:__ use json instead of a prettier (human friendly) string for meta information in the notification. (default: `false`)
* __handleExceptions:__ set to true to have this transport handle exceptions. (default: `false`)

### Azure Table

[winston-azuretable][21] is a Azure Table transport:

``` js
const { AzureLogger } = require('winston-azuretable');
logger.add(new AzureLogger(options));
```

The Azure Table transport connects to an Azure Storage Account using the following options:

* __useDevStorage__: Boolean flag denoting whether to use the Azure Storage Emulator (default: `false`)
* __account__: Azure Storage Account Name. In lieu of this setting, you can set the environment variable: `AZURE_STORAGE_ACCOUNT`
* __key__: Azure Storage Account Key. In lieu of this setting, you can set the environment variable: `AZURE_STORAGE_ACCESS_KEY`
* __level__: lowest logging level transport to be logged (default: `info`)
* __tableName__: name of the table to log messages (default: `log`)
* __partitionKey__: table partition key to use (default: `process.env.NODE_ENV`)
* __silent__: Boolean flag indicating whether to suppress output (default: `false`)

### Cassandra Transport

[winston-cassandra][20] is a Cassandra transport:

``` js
const Cassandra = require('winston-cassandra').Cassandra;
logger.add(new Cassandra(options));
```

The Cassandra transport connects to a cluster using the native protocol with the following options:

* __level:__ Level of messages that this transport should log (default: `'info'`).
* __table:__ The name of the Cassandra column family you want to store log messages in (default: `'logs'`).
* __partitionBy:__ How you want the logs to be partitioned. Possible values `'hour'` and `'day'`(Default).
* __consistency:__ The consistency of the insert query (default: `quorum`).

In addition to the options accepted by the [Node.js Cassandra driver](https://github.com/jorgebay/node-cassandra-cql) Client.

* __hosts:__ Cluster nodes that will handle the write requests:
Array of strings containing the hosts, for example `['host1', 'host2']` (required).
* __keyspace:__ The name of the keyspace that will contain the logs table (required). The keyspace should be already created in the cluster.

### Cisco Spark Transport

[winston-spark][31] is a transport for [Cisco Spark](https://www.ciscospark.com/)

``` js
const winston = require('winston');
require('winston-spark');

const options = {
  accessToken: '***Your Spark Access Token***',
  roomId: '***Spark Room Id***'
};

logger.add(new winston.transports.SparkLogger(options));
```

Valid Options are as the following:
* __accessToken__ Your Spark Access Token. *[required]*
* __roomId__ Spark Room Id. *[required]*
* __level__ Log Level (default: info)
* __hideMeta__ Hide MetaData (default: false)

### Cloudant
[winston-clodant][34] is a transport for Cloudant NoSQL Db.

```js
const winston = require('winston');
const WinstonCloudant = require('winston-cloudant');
logger.add(new WinstonCloudant(options));
```

The Cloudant transport takes the following options:

    url         : Access url including user and password [required]
    username    : Username for the Cloudant DB instance
    password    : Password for the Cloudant DB instance
    host        : Host for the Cloudant DB instance
    db          : Name of the databasename to put logs in
    logstash    : Write logs in logstash format

### Datadog Transport
[datadog-winston][38] is a transport to ship your logs to datadog.

```javascript
var winston = require('winston')
var DatadogWinston = require('datadog-winston')

var logger = winston.createLogger({
  // Whatever options you need
  // Refer https://github.com/winstonjs/winston#creating-your-own-logger
})

logger.add(
  new DatadogWinston({
    apiKey: 'super_secret_datadog_api_key',
    hostname: 'my_machine',
    service: 'super_service',
    ddsource: 'node.js',
    ddtags: 'foo:bar,boo:baz'
  })
)
```

Options:
* __apiKey__: Your datadog api key *[required]*
* __hostname__: The machine/server hostname
* __service__: The name of the application or service generating the logs
* __ddsource__: The technology from which the logs originated
* __ddtags__: Metadata associated with the logs

### Google BigQuery
[winston-bigquery][42] is a transport for Google BigQuery.

```js
import {WinstonBigQuery} from 'winston-bigquery';
import winston, {format} from 'winston';

const logger = winston.createLogger({
	transports: [
		new WinstonBigQuery({
			tableId: 'winston_logs',
			datasetId: 'logs'
		})
	]
});
```

The Google BigQuery takes the following options:

* __datasetId__   	      	    : Your dataset name [required]
* __tableId__     	  	    : Table name in the datase [required]
* __applicationCredentials__    : a path to local service worker (useful in dev env) [Optional]

**Pay Attention**, since BQ, unlike some other products, is not a "schema-less" you will need to build the schema in advance.
read more on the topic on [github][42] or [npmjs.com][43]

### Google Stackdriver Transport

[@google-cloud/logging-winston][29] provides a transport to relay your log messages to [Stackdriver Logging][30].

```js
const winston = require('winston');
const Stackdriver = require('@google-cloud/logging-winston');
logger.add(new Stackdriver({
  projectId: 'your-project-id',
  keyFilename: '/path/to/keyfile.json'
}));
```

### Graylog2 Transport

[winston-graylog2][19] is a Graylog2 transport:

``` js
const winston = require('winston');
const Graylog2 = require('winston-graylog2');
logger.add(new Graylog2(options));
```

The Graylog2 transport connects to a Graylog2 server over UDP using the following options:

* __name__:  Transport name
* __level__: Level of messages this transport should log. (default: info)
* __silent__: Boolean flag indicating whether to suppress output. (default: false)
* __handleExceptions__: Boolean flag, whenever to handle uncaught exceptions. (default: false)
* __graylog__:
  - __servers__; list of graylog2 servers
    * __host__: your server address (default: localhost)
    * __port__: your server port (default: 12201)
  - __hostname__: the name of this host (default: os.hostname())
  - __facility__: the facility for these log messages (default: "Node.js")
  - __bufferSize__: max UDP packet size, should never exceed the MTU of your system (default: 1400)

### Elasticsearch Transport

Log to Elasticsearch in a logstash-like format and
leverage Kibana to browse your logs.

See: https://github.com/vanthome/winston-elasticsearch.

### FastFileRotate Transport

[fast-file-rotate][35] is a performant file transport providing daily log rotation.

```js
const FileRotateTransport = require('fast-file-rotate');
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new FileRotateTransport({
      fileName: __dirname + '/console%DATE%.log'
    })
  ]
})
```

### Humio Transport

[humio-winston][44] is a transport for sending logs to Humio:

``` js
const winston = require('winston');
const HumioTransport = require('humio-winston');

const logger = winston.createLogger({
  transports: [
    new HumioTransport({
      ingestToken: '<YOUR HUMIO INGEST TOKEN>',
    }),
  ],
});
```

### LogDNA Transport

[LogDNA Winston][37] is a transport for being able to forward the logs to [LogDNA](https://logdna.com/):

``` js
const logdnaWinston = require('logdna-winston');
const winston = require('winston');
const logger = winston.createLogger({});
const options = {
    key: apikey, // the only field required
    hostname: myHostname,
    ip: ipAddress,
    mac: macAddress,
    app: appName,
    env: envName,
    index_meta: true // Defaults to false, when true ensures meta object will be searchable
};

// Only add this line in order to track exceptions
options.handleExceptions = true;

logger.add(new logdnaWinston(options));

let meta = {
    data:'Some information'
};
logger.log('info', 'Log from LogDNA Winston', meta);
```

### Logzio Transport

You can download the logzio transport here : [https://github.com/logzio/winston-logzio](https://github.com/logzio/winston-logzio)  

*Basic Usage*  
```js
const winston = require('winston');
const Logzio = require('winston-logzio');

logger.add(new Logzio({
  token: '__YOUR_API_TOKEN__'
}));
```

For more information about how to configure the logzio transport, view the README.md in the [winston-logzio repo](https://github.com/logzio/winston-logzio).

### Logsene Transport

[winston-logsene][24] transport for Elasticsearch bulk indexing via HTTPS to Logsene:

``` js
const winston = require('winston');
const Logsene = require('winston-logsene');

logger.add(new Logsene({
  token: process.env.LOGSENE_TOKEN
  /* other options */
});
```
Options:
* __token__: Logsene Application Token
* __source__: Source of the logs (defaults to main module)

[Logsene](http://www.sematext.com/logsene/) features:
- Fulltext search
- Anomaly detection and alerts
- Kibana4 integration
- Integration with [SPM Performance Monitoring for Node.js](http://www.sematext.com/spm/integrations/nodejs-monitoring.html)

### Mail Transport

The [winston-mail][16] is an email transport:

``` js
const { Mail } = require('winston-mail');
logger.add(new Mail(options));
```

The Mail transport uses [node-mail][17] behind the scenes.  Options are the following, `to` and `host` are required:

* __to:__ The address(es) you want to send to. *[required]*
* __from:__ The address you want to send from. (default: `winston@[server-host-name]`)
* __host:__ SMTP server hostname
* __port:__ SMTP port (default: 587 or 25)
* __secure:__ Use secure
* __username__ User for server auth
* __password__ Password for server auth
* __level:__ Level of messages that this transport should log.
* __silent:__ Boolean flag indicating whether to suppress output.

*Metadata:* Stringified as JSON in email.

### Newrelic Transport

[newrelic-winston][23] is a Newrelic transport:

``` js
const winston = require('winston');
const Newrelic = require('newrelic-winston');
logger.add(new Newrelic(options));
```

The Newrelic transport will send your errors to newrelic and accepts the follwing optins:

* __env__:  the current evironment. Defatuls to `process.env.NODE_ENV`

If `env` is either 'dev' or 'test' the lib will _not_ load the included newrelic module saving devs from anoying errors ;)

### Papertrail Transport

[winston-papertrail][27] is a Papertrail transport:

``` js
const { Papertrail } = require('winston-papertrail');
logger.add(new Papertrail(options));
```

The Papertrail transport connects to a [PapertrailApp log destination](https://papertrailapp.com) over TCP (TLS) using the following options:

* __level:__ Level of messages this transport should log. (default: info)
* __host:__ FQDN or IP address of the Papertrail endpoint.
* __port:__ Port for the Papertrail log destination.
* __hostname:__ The hostname associated with messages. (default: require('os').hostname())
* __program:__ The facility to send log messages.. (default: default)
* __logFormat:__ a log formatting function with the signature `function(level, message)`, which allows custom formatting of the level or message prior to delivery

*Metadata:* Logged as a native JSON object to the 'meta' attribute of the item.

### PostgresQL Transport

[@pauleliet/winston-pg-native](https://github.com/petpano/winston-pg-native) is a PostgresQL transport supporting Winston 3.X.

### Pusher Transport
[winston-pusher](https://github.com/meletisf/winston-pusher) is a Pusher transport.

```js
const { PusherLogger } = require('winston-pusher');
logger.add(new PusherLogger(options));
```

This transport sends the logs to a Pusher app for real time processing and it uses the following options:

* __pusher__ [Object]
  * __appId__ The application id obtained from the dashboard
  * __key__ The application key obtained from the dashboard
  * __secret__ The application secret obtained from the dashboard
  * __cluster__ The cluster
  * __encrypted__ Whether the data will be send through SSL
* __channel__ The channel of the event (default: default)
* __event__ The event name (default: default)

### Sentry Transport
[winston-transport-sentry-node][41] is a transport for [Sentry](https://sentry.io/) uses [@sentry/node](https://www.npmjs.com/package/@sentry/node).

```js
const Sentry = require('winston-transport-sentry-node');
logger.add(new Sentry({
  sentry: {
    dsn: 'https://******@sentry.io/12345',
  },
  level: 'info'
});
```

This transport takes the following options:

* __sentry:__ [Object]
  * __dsn:__ Sentry DSN or Data Source Name (default: `process.env.SENTRY_DSN`) **REQUIRED**
  * __environment:__ The application environment (default: `process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production'`)
  * __serverName:__  The application name
  * __debug:__ Turns debug mode on or off (default: `process.env.SENTRY_DEBUG || false`)
  * __sampleRate:__ Sample rate as a percentage of events to be sent in the range of 0.0 to 1.0 (default: `1.0`)
  * __maxBreadcrumbs:__ Total amount of breadcrumbs that should be captured (default: `100`)
* __level:__ Level of messages that this transport should log
* __silent:__  Boolean flag indicating whether to suppress output, defaults to false

### SimpleDB Transport

The [winston-simpledb][15] transport is just as easy:

``` js
const SimpleDB = require('winston-simpledb').SimpleDB;
logger.add(new SimpleDB(options));
```

The SimpleDB transport takes the following options. All items marked with an asterisk are required:

* __awsAccessKey__:* your AWS Access Key
* __secretAccessKey__:* your AWS Secret Access Key
* __awsAccountId__:* your AWS Account Id
* __domainName__:* a string or function that returns the domain name to log to
* __region__:* the region your domain resides in
* __itemName__: a string ('uuid', 'epoch', 'timestamp') or function that returns the item name to log

*Metadata:* Logged as a native JSON object to the 'meta' attribute of the item.

### Slack Transport
[winston-slack-webhook-transport][39] is a transport that sends all log messages to the Slack chat service. 

```js
const winston = require('winston');
const SlackHook = require('winston-slack-webhook-transport');

const logger = winston.createLogger({
	level: 'info',
	transports: [
		new SlackHook({
			webhookUrl: 'https://hooks.slack.com/services/xxx/xxx/xxx'
		})
	]
});

logger.info('This should now appear on Slack');
```

This transport takes the following options: 

* __webhookUrl__ - Slack incoming webhook URL. This can be from a basic integration or a bot. **REQUIRED**
* __channel__ - Slack channel to post message to.
* __username__ - Username to post message with.
* __iconEmoji__ - Status icon to post message with. (interchangeable with __iconUrl__)
* __iconUrl__ - Status icon to post message with. (interchangeable with __iconEmoji__)
* __formatter__ - Custom function to format messages with. This function accepts the __info__ object ([see Winston documentation](https://github.com/winstonjs/winston/blob/master/README.md#streams-objectmode-and-info-objects)) and must return an object with at least one of the following three keys: __text__ (string), __attachments__ (array of [attachment objects](https://api.slack.com/docs/message-attachments)), __blocks__ (array of [layout block objects](https://api.slack.com/messaging/composing/layouts)). These will be used to structure the format of the logged Slack message. By default, messages will use the format of `[level]: [message]` with no attachments or layout blocks.
* __level__ - Level to log. Global settings will apply if this is blank.
* __unfurlLinks__ - Enables or disables [link unfurling.](https://api.slack.com/docs/message-attachments#unfurling) (Default: false)
* __unfurlMedia__ - Enables or disables [media unfurling.](https://api.slack.com/docs/message-link-unfurling) (Default: false)
* __mrkdwn__ - Enables or disables [`mrkdwn` formatting](https://api.slack.com/messaging/composing/formatting#basics) within attachments or layout blocks (Default: false)

### SQLite3 Transport

The [winston-better-sqlite3][40] transport uses [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3).

```js
const wbs = require('winston-better-sqlite3');
logger.add(new wbs({

    // path to the sqlite3 database file on the disk
    db: '<name of sqlite3 database file>',
    
    // A list of params to log
    params: ['level', 'message']
});
```

### Sumo Logic Transport
[winston-sumologic-transport][32] is a transport for Sumo Logic

``` js
const winston = require('winston');
const { SumoLogic } = require('winston-sumologic-transport');

logger.add(new SumoLogic(options));
```

Options:
* __url__: The Sumo Logic HTTP collector URL

### SSE transport with KOA 2
[winston-koa-sse](https://github.com/alexvictoor/winston-koa-sse) is a transport that leverages on Server Sent Event. With this transport you can use your browser console to view your server logs.    

### Winlog2 Transport

[winston-winlog2][33] is a Windows Event log transport:

``` js
const winston = require('winston');
const Winlog2 = require('winston-winlog2');
logger.add(new Winlog2(options));
```

The winlog2 transport uses the following options:

* __name__:  Transport name
* __eventLog__: Log type (default: 'APPLICATION')
* __source__: Name of application which will appear in event log (default: 'node')

## Looking for maintainers

These transports are part of the `winston` Github organization but are 
actively seeking new maintainers. Interested in getting involved? Open an
issue on `winston` to get the conversation started!

* [CouchDB](#couchdb-transport)
* [Loggly](#loggly-transport)
* [Redis](#redis-transport)
* [Riak](#riak-transport)

### CouchDB Transport

_As of `winston@0.6.0` the CouchDB transport has been broken out into a new module: [winston-couchdb][2]._

``` js
const WinstonCouchDb = require('winston-couchdb');
logger.add(new WinstonCouchdb(options));
```

The `Couchdb` will place your logs in a remote CouchDB database. It will also create a [Design Document][3], `_design/Logs` for later querying and streaming your logs from CouchDB. The transport takes the following options:

* __host:__ (Default: **localhost**) Remote host of the HTTP logging endpoint
* __port:__ (Default: **5984**) Remote port of the HTTP logging endpoint
* __db:__ (Default: **winston**) Remote URI of the HTTP logging endpoint
* __auth:__ (Default: **None**) An object representing the `username` and `password` for HTTP Basic Auth
* __ssl:__ (Default: **false**) Value indicating if we should us HTTPS

### Loggly Transport

_As of `winston@0.6.0` the Loggly transport has been broken out into a new module: [winston-loggly][5]._

``` js
const WinstonLoggly = require('winston-loggly');
logger.add(new winston.transports.Loggly(options));
```

The Loggly transport is based on [Nodejitsu's][6] [node-loggly][7] implementation of the [Loggly][8] API. If you haven't heard of Loggly before, you should probably read their [value proposition][9]. The Loggly transport takes the following options. Either 'inputToken' or 'inputName' is required:

* __level:__ Level of messages that this transport should log.
* __subdomain:__ The subdomain of your Loggly account. *[required]*
* __auth__: The authentication information for your Loggly account. *[required with inputName]*
* __inputName:__ The name of the input this instance should log to.
* __inputToken:__ The input token of the input this instance should log to.
* __json:__ If true, messages will be sent to Loggly as JSON.

### Redis Transport

``` js
const WinstonRedis = require('winston-redis');
logger.add(new WinstonRedis(options));
```

This transport accepts the options accepted by the [node-redis][4] client:

* __host:__ (Default **localhost**) Remote host of the Redis server
* __port:__ (Default **6379**) Port the Redis server is running on.
* __auth:__ (Default **None**) Password set on the Redis server

In addition to these, the Redis transport also accepts the following options.

* __length:__ (Default **200**) Number of log messages to store.
* __container:__ (Default **winston**) Name of the Redis container you wish your logs to be in.
* __channel:__ (Default **None**) Name of the Redis channel to stream logs from.

### Riak Transport

_As of `winston@0.3.0` the Riak transport has been broken out into a new module: [winston-riak][11]._ Using it is just as easy:

``` js
const { Riak } = require('winston-riak');
logger.add(new Riak(options));
```

In addition to the options accepted by the [riak-js][12] [client][13], the Riak transport also accepts the following options. It is worth noting that the riak-js debug option is set to *false* by default:

* __level:__ Level of messages that this transport should log.
* __bucket:__ The name of the Riak bucket you wish your logs to be in or a function to generate bucket names dynamically.

``` js
  // Use a single bucket for all your logs
  const singleBucketTransport = new Riak({ bucket: 'some-logs-go-here' });

  // Generate a dynamic bucket based on the date and level
  const dynamicBucketTransport = new Riak({
    bucket: function (level, msg, meta, now) {
      var d = new Date(now);
      return level + [d.getDate(), d.getMonth(), d.getFullYear()].join('-');
    }
  });
```


## Find more Transports

There are more than 1000 packages on `npm` when [you search for] `winston`.
That's why we say it's a logger for just about everything 

[you search for]: https://www.npmjs.com/search?q=winston
[0]: https://nodejs.org/api/stream.html#stream_class_stream_writable
[1]: https://github.com/flatiron/winstond
[2]: https://github.com/indexzero/winston-couchdb
[3]: http://guide.couchdb.org/draft/design.html
[4]: https://github.com/mranney/node_redis
[5]: https://github.com/indexzero/winston-loggly
[6]: http://nodejitsu.com
[7]: https://github.com/nodejitsu/node-loggly
[8]: http://loggly.com
[9]: http://www.loggly.com/product/
[10]: http://wiki.loggly.com/loggingfromcode
[11]: https://github.com/indexzero/winston-riak
[12]: http://riakjs.org
[13]: https://github.com/frank06/riak-js/blob/master/src/http_client.coffee#L10
[14]: http://github.com/indexzero/winston-mongodb
[15]: http://github.com/appsattic/winston-simpledb
[16]: http://github.com/wavded/winston-mail
[17]: https://github.com/weaver/node-mail
[18]: https://github.com/jesseditson/winston-sns
[19]: https://github.com/namshi/winston-graylog2
[20]: https://github.com/jorgebay/winston-cassandra
[21]: https://github.com/jpoon/winston-azuretable
[22]: https://github.com/rickcraig/winston-airbrake2
[23]: https://github.com/namshi/winston-newrelic
[24]: https://github.com/sematext/winston-logsene
[25]: https://github.com/timdp/winston-aws-cloudwatch
[26]: https://github.com/lazywithclass/winston-cloudwatch
[27]: https://github.com/kenperkins/winston-papertrail
[28]: https://github.com/pkallos/winston-firehose
[29]: https://www.npmjs.com/package/@google-cloud/logging-winston
[30]: https://cloud.google.com/logging/
[31]: https://github.com/joelee/winston-spark
[32]: https://github.com/avens19/winston-sumologic-transport
[33]: https://github.com/peteward44/winston-winlog2
[34]: https://github.com/hakanostrom/winston-cloudant
[35]: https://github.com/SerayaEryn/fast-file-rotate
[36]: https://github.com/inspiredjw/winston-dynamodb
[37]: https://github.com/logdna/logdna-winston
[38]: https://github.com/itsfadnis/datadog-winston
[39]: https://github.com/TheAppleFreak/winston-slack-webhook-transport
[40]: https://github.com/punkish/winston-better-sqlite3
[41]: https://github.com/aandrewww/winston-transport-sentry-node
[42]: https://github.com/kaminskypavel/winston-bigquery
[43]: https://www.npmjs.com/package/winston-bigquery
[44]: https://github.com/Quintinity/humio-winston
