# winston

一個適用於各種用途的日誌記錄工具。

[![npm 版本](https://img.shields.io/npm/v/winston.svg?style=flat-square)](https://www.npmjs.com/package/winston)  
[![npm 下載量](https://img.shields.io/npm/dm/winston.svg?style=flat-square)](https://npmcharts.com/compare/winston?minimal=true)  
[![建構狀態](https://github.com/winstonjs/winston/actions/workflows/ci.yml/badge.svg)](https://github.com/winstonjs/winston/actions/workflows/ci.yml)  
[![覆蓋率狀態](https://coveralls.io/repos/github/winstonjs/winston/badge.svg?branch=master)](https://coveralls.io/github/winstonjs/winston?branch=master)

[![NPM](https://nodei.co/npm/winston.png?downloads=true&downloadRank=true)](https://nodei.co/npm/winston/)

## winston@3

請參閱 [升級指南](UPGRADE-3.0.md) 以了解更多資訊。歡迎提交錯誤回報和拉取請求（PR）！

## 尋找 `winston@2.x` 的文檔？

請注意，以下文檔是針對 `winston@3` 的。  
[閱讀 `winston@2.x` 的文檔]。

## 動機

`winston` 被設計為一個簡單且通用的日誌記錄庫，支持多種傳輸方式（transports）。傳輸方式本質上是日誌的存儲裝置。每個 `winston` 日誌記錄器可以配置多個傳輸方式（詳見：[Transports]），並可設置不同的日誌層級（詳見：[Logging levels]）。例如，有些人可能希望將錯誤日誌存儲在一個持久的遠程位置（如資料庫），而將所有其他日誌輸出到控制台或本地文件中。

`winston` 的目標是將日誌記錄過程的各個部分解耦，使其更加靈活和可擴展。重點支持在日誌格式（詳見：[Formats]）和層級（詳見：[Using custom logging levels]）上的靈活性，並確保這些 API 與傳輸日誌的實現（即如何存儲／索引日誌，詳見：[Adding Custom Transports]）解耦，從而提供給開發者的 API 更加簡單易用。

## 快速開始

如果您想快速了解，請查看位於 `./examples/` 目錄下的 [快速開始範例][quick-example]。  
這裡還有許多其他範例，可以在 [`./examples/*.js`][examples] 中找到。  
沒有您認為應該存在的範例？歡迎提交拉取請求來新增它！

## 使用方式

推薦的 `winston` 使用方式是創建您自己的日誌記錄器。  
最簡單的方式是使用 `winston.createLogger`：

```js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - 將所有重要性等級為 `error` 或更高的日誌寫入 `error.log`
    //   （即錯誤、致命錯誤，但不包括其他級別）
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //
    // - 將所有重要性等級為 `info` 或更高的日誌寫入 `combined.log`
    //   （即致命錯誤、錯誤、警告和信息，但不包括跟蹤信息）
    //
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

//
// 如果我們不在生產環境中，則將日誌寫入 `console`，格式為：
// `${info.level}: ${info.message} JSON.stringify({ ...rest })`
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

您也可以直接使用 `require('winston')` 曝露的默認日誌記錄器，但這僅僅是為了便於在應用中使用共享日誌記錄器。如果您選擇使用它，請注意，默認的日誌記錄器沒有配置任何傳輸方式。您需要自行添加傳輸，且如果沒有配置傳輸，默認日誌記錄器可能會導致較高的內存使用量。

## 目錄

- [winston](#winston)
  - [winston@3](#winston3)
  - [尋找 `winston@2.x` 的文檔？](#尋找-winston2x-的文檔)
  - [動機](#動機)
  - [快速開始](#快速開始)
  - [使用方式](#使用方式)
  - [目錄](#目錄)
  - [日誌記錄](#日誌記錄)
    - [創建您自己的日誌記錄器](#創建您自己的日誌記錄器)
    - [創建子日誌記錄器](#創建子日誌記錄器)
    - [流、`objectMode` 和 `info` 對象](#流objectmode-和-info-對象)
  - [格式](#格式)
    - [組合格式](#組合格式)
    - [字串插值](#字串插值)
    - [過濾 `info` 物件](#過濾-info-物件)
    - [創建自訂格式](#創建自訂格式)
  - [日誌等級](#日誌等級)
    - [使用日誌等級](#使用日誌等級)
    - [使用自訂日誌等級](#使用自訂日誌等級)
    - [為標準日誌等級上色](#為標準日誌等級上色)
    - [當使用 JSON 格式化器時為完整日誌行上色](#當使用-json-格式化器時為完整日誌行上色)
  - [傳輸（Transports）](#傳輸transports)
  - [相同類型的多個傳輸](#相同類型的多個傳輸)
  - [添加自訂傳輸](#添加自訂傳輸)
  - [常見的傳輸選項](#常見的傳輸選項)
  - [異常處理](#異常處理)
    - [使用 winston 處理未捕獲的異常](#使用-winston-處理未捕獲的異常)
    - [是否要在記錄異常後退出？](#是否要在記錄異常後退出)
        - [範例 1](#範例-1)
        - [範例 2](#範例-2)
  - [拒絕處理](#拒絕處理)
    - [使用 winston 處理未捕獲的 Promise 拒絕](#使用-winston-處理未捕獲的-promise-拒絕)
  - [性能分析（Profiling）](#性能分析profiling)
  - [查詢日誌](#查詢日誌)
  - [流式日誌](#流式日誌)
  - [進一步閱讀](#進一步閱讀)
    - [使用預設 Logger](#使用預設-logger)
    - [等待日誌寫入 `winston`](#等待日誌寫入-winston)
    - [在 `winston` 中使用多個 Loggers](#在-winston-中使用多個-loggers)
    - [路由控制台傳輸訊息至 `console`，而非 `stdout` 和 `stderr`](#路由控制台傳輸訊息至-console而非-stdout-和-stderr)
  - [安裝](#安裝)
  - [運行測試](#運行測試)
      - [作者: Charlie Robbins](#作者-charlie-robbins)
      - [貢獻者: Jarrett Cruger, David Hyde, Chris Alderson](#貢獻者-jarrett-cruger-david-hyde-chris-alderson)

## 日誌記錄

在 `winston` 中，日誌層級符合 [RFC5424] 規範：所有層級的嚴重性按數字 **遞增** 排列，從最重要的到最不重要的。

```js
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};
```

### 創建您自己的日誌記錄器

您可以通過使用 `winston.createLogger` 來創建一個日誌記錄器：

```js
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

一個日誌記錄器接受以下參數：

| 參數名稱      | 預設值                      | 描述                                                                                     |
| ------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `level`       | `'info'`                    | 只有當 [`info.level`](#streams-objectmode-and-info-objects) 小於或等於此層級時才記錄日誌 |
| `levels`      | `winston.config.npm.levels` | 表示日誌優先級的層級（和顏色）                                                           |
| `format`      | `winston.format.json`       | 記錄的 `info` 消息的格式（詳見：[Formats]）                                              |
| `transports`  | `[]` _(無傳輸方式)_         | 記錄 `info` 消息的目標                                                                   |
| `exitOnError` | `true`                      | 如果設為 `false`，已處理的異常不會導致 `process.exit`                                    |
| `silent`      | `false`                     | 如果設為 `true`，將會抑制所有日誌                                                        |

在 `createLogger` 中提供的層級將會被定義為 `logger` 實例上的便利方法：

```js
//
// 記錄日誌
//
logger.log({
  level: 'info',
  message: 'Hello distributed log files!'
});

logger.info('Hello again distributed logs');
```

您可以在 `winston.createLogger` 提供的 `logger` 實例上添加或移除傳輸方式：

```js
const files = new winston.transports.File({ filename: 'combined.log' });
const console = new winston.transports.Console();

logger
  .clear()          // 移除所有傳輸方式
  .add(console)     // 添加控制台傳輸方式
  .add(files)       // 添加文件傳輸方式
  .remove(console); // 移除控制台傳輸方式
```

您還可以使用 `configure` 方法來全面重新配置一個 `winston.Logger` 實例：

```js
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

//
// 使用新配置完全替換之前的傳輸方式
//
const DailyRotateFile = require('winston-daily-rotate-file');
logger.configure({
  level: 'verbose',
  transports: [
    new DailyRotateFile(opts)
  ]
});
```

### 創建子日誌記錄器

您可以從現有的日誌記錄器創建子日誌記錄器，並傳遞元數據覆蓋：

```js
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ]
});

const childLogger = logger.child({ requestId: '451' });
```

> **注意**：如果您同時擴展 `Logger` 類，`.child` 方法可能會因為實現細節的問題而出現錯誤，這會導致 `this` 關鍵字指向意外的地方。使用時請小心。

### 流、`objectMode` 和 `info` 對象

在 `winston` 中，`Logger` 和 `Transport` 實例都被視為 [`objectMode`](https://nodejs.org/api/stream.html#stream_object_mode) 流，接受一個 `info` 對象。

提供給某個格式的 `info` 參數代表一條日誌消息。該對象本身是可變的。每個 `info` 必須至少包含 `level` 和 `message` 屬性：

```js
const info = {
  level: 'info',                 // 記錄消息的層級
  message: 'Hey! Log something?' // 記錄的描述性消息
};
```

除了 `level` 和 `message` 外的屬性被視為 "`meta`"。例如：

```js
const { level, message, ...meta } = info;
```

`logform` 中的幾個格式會添加額外的屬性：

| 屬性        | 由哪個格式添加 | 描述                            |
| ----------- | -------------- | ------------------------------- |
| `splat`     | `splat()`      | 用於 `%d %s` 樣式消息的字串插值 |
| `timestamp` | `timestamp()`  | 記錄消息接收的時間戳            |
| `label`     | `label()`      | 與每條消息關聯的自定義標籤      |
| `ms`        | `ms()`         | 自上一條日誌消息以來的毫秒數    |

作為用戶，您可以添加任何您想要的屬性——內部狀態由 `Symbol` 屬性維護：

- `Symbol.for('level')` _**(只讀)**_：等於 `level` 屬性。**所有代碼視為不可變。**
- `Symbol.for('message')`：由“最終格式化”設置的完整消息字串：
  - `json`
  - `logstash`
  - `printf`
  - `prettyPrint`
  - `simple`
- `Symbol.for('splat')`：額外的字串插值參數。_僅由 `splat()` 格式使用。_

這些 `Symbol` 存儲在另一個包中：`triple-beam`，以便所有 `logform` 的使用者都可以共享相同的 `Symbol` 引用。例如：

```js
const { LEVEL, MESSAGE, SPLAT } = require('triple-beam');

console.log(LEVEL === Symbol.for('level'));
// true

console.log(MESSAGE === Symbol.for('message'));
// true

console.log(SPLAT === Symbol.for('splat'));
// true
```

> **注意：** 在提供的 `meta` 對象中，任何 `{ message }` 屬性將會自動與任何已提供的 `msg` 進行串接。例如，下面的代碼將會把 `'world'` 串接到 `'hello'` 上：

```js
logger.log('error', 'hello', { message: 'world' });
logger.info('hello', { message: 'world' });
```

## 格式

在 `winston` 中，格式可以從 `winston.format` 存取。它們是透過 [`logform`](https://github.com/winstonjs/logform) 實作的，這是與 `winston` 分開的模組。這樣的設計提供了撰寫自訂傳輸時的靈活性，讓你可以在傳輸中包含預設格式。

在現代版本的 `node` 中，模板字串（template strings）效能非常高，並且是進行大部分用戶端格式化的推薦方式。如果你想自訂格式化你的日誌，`winston.format.printf` 就是為你量身打造的：

```js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: 'right meow!' }),
    timestamp(),
    myFormat
  ),
  transports: [new transports.Console()]
});
```

若想了解有哪些內建格式可以使用，並學習如何創建自訂日誌格式，請參考 [`logform`](https://github.com/winstonjs/logform)。

### 組合格式

任何數量的格式都可以使用 `format.combine` 組合成單一格式。由於 `format.combine` 不接受 `opts`，作為便利，它會返回預先創建的組合格式實例。

```js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
  format: combine(
    label({ label: 'right meow!' }),
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.Console()]
});

logger.log({
  level: 'info',
  message: 'What time is the testing at?'
});
// 輸出：
// { level: 'info',
//   message: 'What time is the testing at?',
//   label: 'right meow!',
//   timestamp: '2017-09-30T03:57:26.875Z' }
```

### 字串插值

`log` 方法提供了字串插值功能，使用 [util.format]。**必須透過 `format.splat()` 啟用此功能。**

以下是定義一個格式，使用 `format.splat` 進行訊息的字串插值，並使用 `format.simple` 將整個 `info` 訊息序列化的範例。

```js
const { createLogger, format, transports } = require('winston');
const logger = createLogger({
  format: format.combine(
    format.splat(),
    format.simple()
  ),
  transports: [new transports.Console()]
});

// info: test message my string {}
logger.log('info', 'test message %s', 'my string');

// info: test message 123 {}
logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });
```

### 過濾 `info` 物件

如果你希望在日誌時完全過濾掉某個 `info` 物件，只需返回一個假值。

```js
const { createLogger, format, transports } = require('winston');

// 忽略含有 { private: true } 的日誌訊息
const ignorePrivate = format((info, opts) => {
  if (info.private) { return false; }
  return info;
});

const logger = createLogger({
  format: format.combine(
    ignorePrivate(),
    format.json()
  ),
  transports: [new transports.Console()]
});

// 輸出: {"level":"error","message":"Public error to share"}
logger.log({
  level: 'error',
  message: 'Public error to share'
});

// 訊息含有 { private: true } 時，不會被記錄
logger.log({
  private: true,
  level: 'error',
  message: 'This is super secret - hide it.'
});
```

使用 `format.combine` 時會尊重所有返回的假值，並停止後續格式的評估。例如：

```js
const { format } = require('winston');
const { combine, timestamp, label } = format;

const willNeverThrow = format.combine(
  format(info => { return false })(), // 忽略所有訊息
  format(info => { throw new Error('Never reached') })()
);
```

### 創建自訂格式

格式是原型物件（即類別實例），它定義了一個方法：`transform(info, opts)`，並返回修改過的 `info`：

- `info`: 代表日誌訊息的物件。
- `opts`: 特定於當前格式實例的設置。

它們預期會返回以下兩者之一：

- **一個 `info` 物件**，代表修改過的 `info` 參數。若偏好不變性，則不必保留物件引用。當前所有內建格式都認為 `info` 是可變的，但未來版本可能會考慮使用 [immutablejs]。
- **一個假值**，表示 `info` 物件應該被忽略。（參見：[過濾 `info` 物件](#過濾-info-物件)）

`winston.format` 的設計盡可能簡單。若要定義新的格式，只需傳遞一個 `transform(info, opts)` 函數來創建新的 `Format`。

返回的 `Format` 可用來創建任意數量的該格式的實例：

```js
const { format } = require('winston');

const volume = format((info, opts) => {
  if (opts.yell) {
    info.message = info.message.toUpperCase();
  } else if (opts.whisper) {
    info.message = info.message.toLowerCase();
  }

  return info;
});

// `volume` 現在是一個返回格式實例的函數
const scream = volume({ yell: true });
console.dir(scream.transform({
  level: 'info',
  message: `sorry for making you YELL in your head!`
}, scream.options));
// {
//   level: 'info',
//   message: 'SORRY FOR MAKING YOU YELL IN YOUR HEAD!'
// }

// `volume` 可多次使用，創建不同的格式。
const whisper = volume({ whisper: true });
console.dir(whisper.transform({
  level: 'info',
  message: `WHY ARE THEY MAKING US YELL SO MUCH!`
}, whisper.options));
// {
//   level: 'info',
//   message: 'why are they making us yell so much!'
// }
```

## 日誌等級

`winston` 的日誌等級符合 [RFC5424] 規範：所有等級的嚴重性按數字**遞增**排序，從最重要到最不重要。

每個 `level` 都會分配一個具體的整數優先級。優先級數字越高，表示訊息越重要，數字越低則表示優先級越低。例如，根據 RFC5424 規範，`syslog` 的等級從 0 到 7（從高到低）：

```js
{
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}
```

類似地，`npm` 的日誌等級從 0 到 6（從高到低）：

```js
{
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}
```

如果你沒有明確定義 `winston` 要使用的等級，則會使用上面所示的 `npm` 等級。

### 使用日誌等級

設置日誌訊息的等級可以透過兩種方式完成。你可以將表示日誌等級的字串傳遞給 `log()` 方法，或者使用 `winston` Logger 上每個等級對應的方法。

```js
//
// 任何 logger 實例
//
logger.log('silly', "127.0.0.1 - there's no place like home");
logger.log('debug', "127.0.0.1 - there's no place like home");
logger.log('verbose', "127.0.0.1 - there's no place like home");
logger.log('info', "127.0.0.1 - there's no place like home");
logger.log('warn', "127.0.0.1 - there's no place like home");
logger.log('error', "127.0.0.1 - there's no place like home");
logger.info("127.0.0.1 - there's no place like home");
logger.warn("127.0.0.1 - there's no place like home");
logger

.error("127.0.0.1 - there's no place like home");

//
// 預設 logger
//
winston.log('info', "127.0.0.1 - there's no place like home");
winston.info("127.0.0.1 - there's no place like home");
```

`winston` 允許你在每個傳輸中定義 `level` 屬性，這會指定傳輸應該記錄的**最大**訊息等級。例如，使用 `syslog` 等級，你可以將 `error` 訊息僅記錄到控制台，而將所有 `info` 及以下訊息記錄到文件（包括 `error` 訊息）：

```js
const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    new winston.transports.Console({ level: 'error' }),
    new winston.transports.File({
      filename: 'combined.log',
      level: 'info'
    })
  ]
});
```

你也可以動態改變某個傳輸的日誌等級：

```js
const transports = {
  console: new winston.transports.Console({ level: 'warn' }),
  file: new winston.transports.File({ filename: 'combined.log', level: 'error' })
};

const logger = winston.createLogger({
  transports: [
    transports.console,
    transports.file
  ]
});

logger.info('這不會在任何傳輸中記錄！');
transports.console.level = 'info';
transports.file.level = 'info';
logger.info('這會在兩個傳輸中都記錄！');
```

`winston` 支援自訂日誌等級，預設使用 npm 風格的日誌等級。等級必須在創建 logger 時指定。

### 使用自訂日誌等級

除了 `winston` 預設的 `npm`、`syslog` 和 `cli` 等級之外，你還可以選擇定義自己的日誌等級：

```js
const myCustomLevels = {
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

const customLevelLogger = winston.createLogger({
  levels: myCustomLevels.levels
});

customLevelLogger.foobar('一些 foobar 等級的訊息');
```

儘管這個資料結構有些重複，但如果你不希望使用顏色，它還是非常簡單。如果你希望使用顏色，除了將等級傳遞給 Logger 之外，還需要讓 `winston` 知道這些顏色：

```js
winston.addColors(myCustomLevels.colors);
```

這樣，使用 `colorize` 格式化器的 logger 就能夠適當地為自訂等級的輸出添加顏色和樣式。

此外，你也可以改變背景顏色和字型樣式。例如：

```js
baz: 'italic yellow',
foobar: 'bold red cyanBG'
```

可用的選項如下：

* 字型樣式：`bold`、`dim`、`italic`、`underline`、`inverse`、`hidden`、`strikethrough`。
* 字型前景顏色：`black`、`red`、`green`、`yellow`、`blue`、`magenta`、`cyan`、`white`、`gray`、`grey`。
* 背景顏色：`blackBG`、`redBG`、`greenBG`、`yellowBG`、`blueBG`、`magentaBG`、`cyanBG`、`whiteBG`。

### 為標準日誌等級上色

要為標準日誌等級上色，可以這樣做：

```js
winston.format.combine(
  winston.format.colorize(),
  winston.format.simple()
);
```

其中，`winston.format.simple()` 是你想要使用的其他格式化器。`colorize` 格式化器必須放在任何其他為文字上色的格式化器之前。

### 當使用 JSON 格式化器時為完整日誌行上色

若要在使用 JSON 格式化器時為完整的日誌行上色，你可以這樣做：

```js
winston.format.combine(
  winston.format.json(),
  winston.format.colorize({ all: true })
);
```

## 傳輸（Transports）

`winston` 包含了幾個 [核心傳輸（core transports）]，這些傳輸利用了 Node.js 核心提供的網路和文件 I/O 功能。此外，也有一些由社群成員編寫的 [附加傳輸（additional transports）]。

## 相同類型的多個傳輸

可以使用相同類型的多個傳輸，例如，使用多個 `winston.transports.File`：

```js
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'combined.log',
      level: 'info'
    }),
    new winston.transports.File({
      filename: 'errors.log',
      level: 'error'
    })
  ]
});
```

如果之後想要移除其中一個傳輸，可以使用該傳輸本身。例如：

```js
const combinedLogs = logger.transports.find(transport => {
  return transport.filename === 'combined.log';
});

logger.remove(combinedLogs);
```

## 添加自訂傳輸

添加自訂傳輸非常簡單。你只需要接受所需的任何選項，實作 `log()` 方法，並使用 `winston` 消耗它。

```js
const Transport = require('winston-transport');
const util = require('util');

//
// 繼承自 `winston-transport`，以便可以利用基本功能和 `.exceptions.handle()`
//
module.exports = class YourCustomTransport extends Transport {
  constructor(opts) {
    super(opts);
    //
    // 在這裡消耗任何自訂選項，例如：
    // - 資料庫的連線資訊
    // - API 的驗證資訊（例如 loggly、papertrail、logentries 等）。
    //
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // 執行寫入遠端服務的操作
    callback();
  }
};
```

## 常見的傳輸選項

由於每個傳輸都繼承自 [winston-transport]，因此可以在每個傳輸上單獨設置自訂格式和自訂日誌等級：

```js
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: winston.format.json()
    }),
    new winston.transports.Http({
      level: 'warn',
      format: winston.format.json()
    }),
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
```

## 異常處理

### 使用 winston 處理未捕獲的異常

使用 `winston`，可以捕捉並記錄來自進程的 `uncaughtException` 事件。你可以在創建 logger 實例時啟用此功能，或者在應用程序的生命周期中稍後啟用：

```js
const { createLogger, transports } = require('winston');

// 在創建 logger 時啟用異常處理
const logger = createLogger({
  transports: [
    new transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'exceptions.log' })
  ]
});

// 或者稍後啟用，可以通過添加傳輸或使用 `.exceptions.handle` 來啟用
const logger = createLogger({
  transports: [
    new transports.File({ filename: 'combined.log' })
  ]
});

// 調用 exceptions.handle 並傳入傳輸來處理異常
logger.exceptions.handle(
  new transports.File({ filename: 'exceptions.log' })
);
```

如果你希望使用預設的 logger，只需簡單地調用 `.exceptions.handle()` 並傳入傳輸實例。

```js
//
// 你可以透過將傳輸傳遞給 `.exceptions.handle` 來添加單獨的異常記錄器
//
winston.exceptions.handle(
  new winston.transports.File({ filename: 'path/to/exceptions.log' })
);

//
// 或者，你也可以在添加傳輸時將 `handleExceptions` 設為 true
//
winston.add(new winston.transports.File({
  filename: 'path/to/combined.log',
  handleExceptions: true
}));
```

### 是否要在記錄異常後退出？

預設情況下，當 `winston` 記錄一個未捕獲的異常時，它會退出。如果這不是你想要的行為，可以將 `exitOnError = false`。

```js
const logger = winston.createLogger({ exitOnError: false });

//
// 或者，像這樣：
//
logger.exitOnError = false;
```

當使用自訂的 logger 實例時，你可以將不同的傳輸傳遞給 `exceptionHandlers` 屬性，或者在任何傳輸上設置 `handleExceptions`。

##### 範例 1

```js
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'path/to/combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'path/to/exceptions.log' })
  ]
});
```

##### 範例 2

```js
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true
    })
  ],
  exitOnError: false
});
```

`exitOnError` 選項也可以是一個函數，用來僅對某些類型的錯誤防止退出：

```js
function ignoreEpipe(err) {
  return err.code !== 'EPIPE';
}

const logger = winston.createLogger({ exitOnError: ignoreEpipe });

//
// 或者，像這樣：
//
logger.exitOnError = ignoreEpipe;
```

## 拒絕處理

### 使用 winston 處理未捕獲的 Promise 拒絕

`winston` 可以捕獲並記錄來自進程的 `unhandledRejection` 事件。你可以在創建自己的 logger 實例時啟用此功能，或者稍後在應用程序的生命週期中啟用：

```js
const { createLogger, transports } = require('winston');

// 在創建 logger 時啟用拒絕處理
const logger = createLogger({
  transports: [
    new transports.File({ filename: 'combined.log' })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'rejections.log' })
  ]
});

// 或者稍後啟用，可以通過添加傳輸或使用 `.rejections.handle` 來啟用
const logger = createLogger({
  transports: [
    new transports.File({ filename: 'combined.log' })
  ]
});

// 調用 rejections.handle 並傳入傳輸來處理拒絕
logger.rejections.handle(
  new transports.File({ filename: 'rejections.log' })
);
```

如果你希望使用預設的 logger，只需簡單地調用 `.rejections.handle()` 並傳入傳輸實例。

```js
//
// 你可以透過將傳輸傳遞給 `.rejections.handle` 來添加單獨的拒絕記錄器
//
winston.rejections.handle(
  new winston.transports.File({ filename: 'path/to/rejections.log' })
);

//
// 或者，你也可以在添加傳輸時將 `handleRejections` 設為 true
//
winston.add(new winston.transports.File({
  filename: 'path/to/combined.log',
  handleRejections: true
}));
```

## 性能分析（Profiling）

除了記錄訊息和元資料，`winston` 還提供了一個簡單的性能分析機制，適用於任何 logger：

```js
//
// 開始 'test' 的性能分析
//
logger.profile('test');

setTimeout(function () {
  //
  // 停止 'test' 的性能分析，並開始記錄：
  //   '17 Jan 21:00:00 - info: test duration=1000ms'
  //
  logger.profile('test');
}, 1000);
```

你也可以啟動一個計時器並保持對象的引用，然後在之後調用 `.done()`：

```js
 // 返回一個對應於特定計時的對象，當調用 done 時，計時器會完成並記錄持續時間。例如：
 //
 const profiler = logger.startTimer();
 setTimeout(function () {
   profiler.done({ message: 'Logging message' });
 }, 1000);
```

所有的性能分析訊息預設設為 `info` 等級，並且訊息和元資料都是可選的。對於單個性能分析訊息，你可以通過提供包含 `level` 屬性的元資料來覆蓋預設的日誌等級：

```js
logger.profile('test', { level: 'debug' });
```

## 查詢日誌

`winston` 支援使用類似 Loggly 的選項查詢日誌。具體來說，包括：`File`、`Couchdb`、`Redis`、`Loggly`、`Nssocket` 和 `Http`。

```js
const options = {
  from: new Date() - (24 * 60 * 60 * 1000),
  until: new Date(),
  limit: 10,
  start: 0,
  order: 'desc',
  fields: ['message']
};

//
// 查詢昨天到今天之間記錄的項目
//
logger.query(options, function (err, results) {
  if (err) {
    /* TODO: 處理錯誤 */
    throw err;
  }

  console.log(results);
});
```

## 流式日誌

流式處理讓你可以從選定的傳輸中流回日誌。

```js
//
// 從結尾開始
//
winston.stream({ start: -1 }).on('log', function(log) {
  console.log(log);
});
```

## 進一步閱讀

### 使用預設 Logger

預設 logger 可以通過 `winston` 模組直接訪問。你可以在預設 logger 上調用任何在 logger 實例上可以調用的方法：

```js
const winston = require('winston');

winston.log('info', 'Hello 分佈式日誌文件!');
winston.info('再次打招呼，分佈式日誌');

winston.level = 'debug';
winston.log('debug', '現在我的 debug 訊息會被寫入到控制台！');
```

預設情況下，預設 logger 並沒有設置傳輸。你必須通過 `add()` 和 `remove()` 方法來添加或移除傳輸：

```js
const files = new winston.transports.File({ filename: 'combined.log' });
const console = new winston.transports.Console();

winston.add(console);
winston.add(files);
winston.remove(console);
```

或者可以通過一次調用 `configure()` 來配置：

```js
winston.configure({
  transports: [
    new winston.transports.File({ filename: 'somefile.log' })
  ]
});
```

更多關於使用 `winston` 支援的每個單獨傳輸的文檔，請參閱 [`winston` Transports](docs/transports.md)。

### 等待日誌寫入 `winston`

有時候，在進程退出之前等待日誌被寫入是非常有用的。每個 `winston.Logger` 實例也是一個 [Node.js stream]。當所有日誌都寫入所有傳輸並且流結束後，會觸發 `finish` 事件。

```js
const transport = new winston.transports.Console();
const logger = winston.createLogger({
  transports: [transport]
});

logger.on('finish', function (info) {
  // 所有的 `info` 日誌訊息現在都已經被寫入
});

logger.info('冷靜點，Winston！', { seriously: true });
logger.end();
```

還需要注意的是，當 logger 本身發生錯誤時，它也會觸發 `error` 事件，你應該處理或抑制它，以免產生未處理的異常：

```js
//
// 處理來自 logger 本身的錯誤
//
logger.on('error', function (err) { /* 做些什麼 */ });
```

### 在 `winston` 中使用多個 Loggers

在較大的應用中，經常需要擁有多個 logger 實例，每個實例都有不同的設置。每個 logger 負責處理不同的功能區域（或類別）。在 `winston` 中，可以通過 `winston.loggers` 和 `winston.Container` 實例來實現。實際上，`winston.loggers` 只是 `winston.Container` 的預定義實例：

```js
const winston = require('winston');
const { format } = winston;
const { combine, label, json } = format;

//
// 配置 `category1` 的 logger
//
winston.loggers.add('category1', {
  format: combine(
    label({ label: 'category one' }),
    json()
  ),
  transports: [
    new winston.transports.Console({ level: 'silly' }),
    new winston.transports.File({ filename: 'somefile.log' })
  ]
});

//
// 配置 `category2` 的 logger
//
winston.loggers.add('category2', {
 

 format: combine(
    label({ label: 'category two' }),
    json()
  ),
  transports: [
    new winston.transports.Http({ host: 'localhost', port: 8080 })
  ]
});
```

現在你已經配置了這些 loggers，可以在應用中的任何文件中通過 `winston` 訪問這些預配置的 loggers：

```js
const winston = require('winston');

//
// 獲取你預配置的 loggers
//
const category1 = winston.loggers.get('category1');
const category2 = winston.loggers.get('category2');

category1.info('寫入文件和控制台的日誌');
category2.info('寫入 http 傳輸的日誌');
```

如果你希望自己管理 `Container`，可以簡單地實例化一個：

```js
const winston = require('winston');
const { format } = winston;
const { combine, label, json } = format;

const container = new winston.Container();

container.add('category1', {
  format: combine(
    label({ label: 'category one' }),
    json()
  ),
  transports: [
    new winston.transports.Console({ level: 'silly' }),
    new winston.transports.File({ filename: 'somefile.log' })
  ]
});

const category1 = container.get('category1');
category1.info('寫入文件和控制台的日誌');
```

### 路由控制台傳輸訊息至 `console`，而非 `stdout` 和 `stderr`

預設情況下，`winston.transports.Console` 傳輸將訊息發送到 `stdout` 和 `stderr`。這在大多數情況下是可以接受的，但有些情況下可能不太理想，包括：

- 使用 VSCode 進行調試並附加到現有的 Node.js 進程，而非啟動一個新進程
- 在 AWS Lambda 中寫入 JSON 格式的訊息
- 在使用 `--silent` 選項運行 Jest 測試時記錄訊息

為了讓傳輸使用 `console.log()`、`console.warn()` 和 `console.error()`，可以將 `forceConsole` 選項設置為 `true`：

```js
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console({ forceConsole: true })]
});
```

## 安裝

```bash
npm install winston
```

或者使用 `yarn`：

```bash
yarn add winston
```

## 運行測試

所有的 `winston` 測試都是使用 [`mocha`](https://mochajs.org)、[`nyc`](https://github.com/istanbuljs/nyc) 和 [`assume`](https://github.com/bigpipe/assume) 寫的。這些測試可以使用 `npm` 執行：

```bash
npm test
```

#### 作者: [Charlie Robbins]
#### 貢獻者: [Jarrett Cruger], [David Hyde], [Chris Alderson]

[Transports]: #transports  
[Logging levels]: #logging-levels  
[Formats]: #formats  
[Using custom logging levels]: #using-custom-logging-levels  
[Adding Custom Transports]: #adding-custom-transports  
[core transports]: docs/transports.md#winston-core  
[additional transports]: docs/transports.md#additional-transports

[RFC5424]: https://tools.ietf.org/html/rfc5424  
[util.format]: https://nodejs.org/dist/latest/docs/api/util.html#util_util_format_format_args  
[mocha]: https://mochajs.org  
[nyc]: https://github.com/istanbuljs/nyc  
[assume]: https://github.com/bigpipe/assume  
[logform]: https://github.com/winstonjs/logform#readme  
[winston-transport]: https://github.com/winstonjs/winston-transport

[閱讀 `winston@2.x` 的文檔]: https://github.com/winstonjs/winston/tree/2.x

[quick-example]: https://github.com/winstonjs/winston/blob/master/examples/quick-start.js  
[examples]: https://github.com/winstonjs/winston/tree/master/examples

[Charlie Robbins]: http://github.com/indexzero  
[Jarrett Cruger]: https://github.com/jcrugzz  
[David Hyde]: https://github.com/dabh  
[Chris Alderson]: https://github.com/chrisalderson
