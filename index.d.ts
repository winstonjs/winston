// Type definitions for winston 3.0
// Project: https://github.com/winstonjs/winston

/// <reference types="node" />

import * as NodeJSStream from 'stream';

import * as logform from 'logform';
import * as Transport from 'winston-transport';

import * as Config from './lib/winston/config/index';
import * as Transports from './lib/winston/transports/index';

type NoInfer<T> = [T][T extends any ? 0 : never];

declare namespace winston {
  // Hoisted namespaces from other modules
  export import format = logform.format;
  export import Logform = logform;
  export import config = Config;
  export import transports = Transports;
  export import transport = Transport;

  class ExceptionHandler {
    constructor(logger: Logger);
    logger: Logger;
    handlers: Map<any, any>;
    catcher: Function | boolean;

    handle(...transports: Transport[]): void;
    unhandle(...transports: Transport[]): void;
    getAllInfo(err: string | Error): object;
    getProcessInfo(): object;
    getOsInfo(): object;
    getTrace(err: Error): object;
  }

  class RejectionHandler {
    constructor(logger: Logger);
    logger: Logger;
    handlers: Map<any, any>;
    catcher: Function | boolean;

    handle(...transports: Transport[]): void;
    unhandle(...transports: Transport[]): void;
    getAllInfo(err: string | Error): object;
    getProcessInfo(): object;
    getOsInfo(): object;
    getTrace(err: Error): object;
  }

  interface QueryOptions {
    rows?: number;
    limit?: number;
    start?: number;
    from?: Date;
    until?: Date;
    order?: 'asc' | 'desc';
    fields: any;
  }

  class Profiler {
    logger: Logger;
    start: Number;
    done(info?: any): boolean;
  }

  interface LogEntry<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels> {
    level: keyof Levels,
    message: string;
    [optionName: string]: any;
  }

  interface LogMethod<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels> {
    (level: keyof Levels, message: string, ...meta: any[]): Logger<Levels>;
    (entry: LogEntry<Levels>): Logger<Levels>;
    (level: keyof Levels, message: any): Logger<Levels>;
  }

  interface LeveledLogMethod<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels> {
    (message: string, ...meta: any[]): Logger<Levels>;
    (message: any): Logger<Levels>;
    (infoObject: object): Logger<Levels>;
  }

  type LeveledLogMethods<Levels extends Config.AbstractConfigSetLevels<Levels>> = {
    [level in keyof Levels]: LeveledLogMethod<Levels>;
  };

  interface LoggerOptions<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels> {
    levels?: Levels;
    silent?: boolean;
    format?: logform.Format;
    level?: NoInfer<keyof Levels>;
    exitOnError?: Function | boolean;
    defaultMeta?: any;
    transports?: Transport[] | Transport;
    handleExceptions?: boolean;
    handleRejections?: boolean;
    exceptionHandlers?: any;
    rejectionHandlers?: any;
  }

  class LoggerInstance<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels> extends NodeJSStream.Transform {
    constructor(options?: LoggerOptions<Levels>);

    silent: boolean;
    format: logform.Format;
    levels: Levels;
    level: keyof Levels;
    transports: Transport[];
    exceptions: ExceptionHandler;
    rejections: RejectionHandler;
    profilers: object;
    exitOnError: Function | boolean;
    defaultMeta?: any;

    log: LogMethod<Levels>;
    add(transport: Transport): this;
    remove(transport: Transport): this;
    clear(): this;
    close(): this;

    query(
      options?: QueryOptions,
      callback?: (err: Error, results: any) => void
    ): any;
    stream(options?: any): NodeJS.ReadableStream;

    startTimer(): Profiler;
    profile(id: string | number, meta?: Record<string, any>): this;

    configure(options: LoggerOptions<Levels>): void;

    child(options: Object): this;

    isLevelEnabled(level: string): boolean;
    isErrorEnabled(): boolean;
    isWarnEnabled(): boolean;
    isInfoEnabled(): boolean;
    isVerboseEnabled(): boolean;
    isDebugEnabled(): boolean;
    isSillyEnabled(): boolean;
  }

  type Logger<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels> = LoggerInstance<Levels> & LeveledLogMethods<Levels>;

  const Logger: typeof LoggerInstance;

  class Container {
    loggers: Map<string, Logger>;
    options: LoggerOptions;

    add<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels>(id: string, options?: LoggerOptions<Levels>): Logger<Levels>;
    get<Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels>(id: string, options?: LoggerOptions<Levels>): Logger<Levels>;
    has(id: string): boolean;
    close(id?: string): void;

    constructor(options?: LoggerOptions);
  }

  let version: string;
  let loggers: Container;

  let addColors: (target: Config.AbstractConfigSetColors) => any;
  let createLogger: <Levels extends Config.AbstractConfigSetLevels<Levels> = Config.NpmConfigSetLevels>(options?: LoggerOptions<Levels>) => Logger<Levels>;

  // Pass-through npm level methods routed to the default logger.
  let error: LeveledLogMethod;
  let warn: LeveledLogMethod;
  let info: LeveledLogMethod;
  let http: LeveledLogMethod;
  let verbose: LeveledLogMethod;
  let debug: LeveledLogMethod;
  let silly: LeveledLogMethod;

  // Other pass-through methods routed to the default logger.
  let log: LogMethod;
  let query: (
    options?: QueryOptions,
    callback?: (err: Error, results: any) => void
  ) => any;
  let stream: (options?: any) => NodeJS.ReadableStream;
  let add: (transport: Transport) => Logger;
  let remove: (transport: Transport) => Logger;
  let clear: () => Logger;
  let startTimer: () => Profiler;
  let profile: (id: string | number) => Logger;
  let configure: (options: LoggerOptions) => void;
  let child: (options: Object) => Logger;
  let level: string;
  let exceptions: ExceptionHandler;
  let rejections: RejectionHandler;
  let exitOnError: Function | boolean;
  // let default: object;
}

export = winston;
