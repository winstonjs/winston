// Type definitions for winston 3.0
// Project: https://github.com/winstonjs/winston

/// <reference types="node" />

import * as NodeJSStream from 'stream';

import * as logform from 'logform';
import * as Transport from 'winston-transport';

import * as Config from './lib/winston/config/index';
import * as Transports from './lib/winston/transports/index';

declare namespace winston {
  // Hoisted namespaces from other modules
  export import format = logform.format;
  export import Logform = logform;
  export import config = Config;
  export import transports = Transports;
  export import transport = Transport;

  type defaultLevels = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";

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

  type LogCallback<T extends string = defaultLevels> = (
    error?: any,
    level?: T,
    message?: string,
    meta?: any
  ) => void;

  interface LogEntry<T extends string = defaultLevels> {
    level: T;
    message: string;
    [optionName: string]: any;
  }

  interface LogMethod<T extends string = defaultLevels> {
    (level: T, message: string, callback: LogCallback<T>): Logger<T>;
    (level: T, message: string, meta: any, callback: LogCallback<T>): Logger<T>;
    (level: T, message: string, ...meta: any[]): Logger<T>;
    (entry: LogEntry<T>): Logger<T>;
    (level: T, message: any): Logger<T>;
  }

  interface LeveledLogMethod {
    (message: string, callback: LogCallback): Logger;
    (message: string, meta: any, callback: LogCallback): Logger;
    (message: string, ...meta: any[]): Logger;
    (message: any): Logger;
    (infoObject: object): Logger;
  }

  interface LoggerOptions<T extends string = defaultLevels> {
    levels?: Config.AbstractConfigSetLevels<T>;
    silent?: boolean;
    format?: logform.Format;
    level?: string;
    exitOnError?: Function | boolean;
    defaultMeta?: any;
    transports?: Transport[] | Transport;
    handleExceptions?: boolean;
    handleRejections?: boolean;
    exceptionHandlers?: any;
    rejectionHandlers?: any;
  }

  // Used to dynamically add log levels
  type LoggerLogFunctionsMap<T extends string> = {
    [key in T]: LeveledLogMethod;
  };
  type LoggerLogEnabledMap<T extends string> = {
    [key in `is${Capitalize<T>}Enabled`]: () => boolean;
  };

  interface LoggerBase<T extends string> extends NodeJSStream.Transform {
    new <T extends string = defaultLevels>(options?: LoggerOptions<T>): Logger<T>;

    silent: boolean;
    format: logform.Format;
    levels: Config.AbstractConfigSetLevels<T>;
    level: string;
    transports: Transport[];
    exceptions: ExceptionHandler;
    rejections: RejectionHandler;
    profilers: object;
    exitOnError: Function | boolean;
    defaultMeta?: any;

    log: LogMethod<T>;
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

    configure(options: LoggerOptions<T>): void;

    child(options: Object): this;

    isLevelEnabled(level: T): boolean;
  }
  export type Logger<T extends string = defaultLevels> = LoggerBase<T> & LoggerLogFunctionsMap<T> & LoggerLogEnabledMap<T>;
  export const Logger: Logger;
  class Container {
    loggers: Map<string, Logger>;
    options: LoggerOptions<string>;

    add(id: string, options?: LoggerOptions<string>): Logger;
    get(id: string, options?: LoggerOptions<string>): Logger;
    has(id: string): boolean;
    close(id?: string): void;

    constructor(options?: LoggerOptions<string>);
  }

  let version: string;
  let loggers: Container;

  let addColors: (target: Config.AbstractConfigSetColors) => any;
  let createLogger: <T extends string>(options?: LoggerOptions<T>) => Logger<T>;

  // Pass-through npm level methods routed to the default logger.
  let error: LeveledLogMethod;
  let warn: LeveledLogMethod;
  let info: LeveledLogMethod;
  let http: LeveledLogMethod;
  let verbose: LeveledLogMethod;
  let debug: LeveledLogMethod;
  let silly: LeveledLogMethod;

  // Other pass-through methods routed to the default logger.
  let log: LogMethod<defaultLevels>;
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
  let configure: <T extends string = defaultLevels>(options: LoggerOptions<T>) => void;
  let child: (options: Object) => Logger;
  let level: string;
  let exceptions: ExceptionHandler;
  let rejections: RejectionHandler;
  let exitOnError: Function | boolean;
  // let default: object;
}

export = winston;
