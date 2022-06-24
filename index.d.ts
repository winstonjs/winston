// Type definitions for winston 3.0
// Project: https://github.com/winstonjs/winston

/// <reference types="node" />

import * as NodeJSStream from "stream";

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

  interface ExceptionHandler<L extends string = Config.NpmLevels> {
    logger: Logger<L>;
    handlers: Map<any, any>;
    catcher: Function | boolean;

    handle(...transports: Transport[]): void;
    unhandle(...transports: Transport[]): void;
    getAllInfo(err: string | Error): object;
    getProcessInfo(): object;
    getOsInfo(): object;
    getTrace(err: Error): object;

    new(logger: Logger<L>): ExceptionHandler<L>;
  }
  
  interface RejectionHandler<L extends string = Config.NpmLevels> {
    logger: Logger<L>;
    handlers: Map<any, any>;
    catcher: Function | boolean;

    handle(...transports: Transport[]): void;
    unhandle(...transports: Transport[]): void;
    getAllInfo(err: string | Error): object;
    getProcessInfo(): object;
    getOsInfo(): object;
    getTrace(err: Error): object;

    new(logger: Logger<L>): RejectionHandler<L>;
  }

  interface QueryOptions {
    rows?: number;
    limit?: number;
    start?: number;
    from?: Date;
    until?: Date;
    order?: "asc" | "desc";
    fields: any;
  }

  interface Profiler<L extends string = Config.NpmLevels> {
    logger: Logger<L>;
    start: Number;
    done(info?: any): boolean;
  }

  type LogCallback = <L extends string = Config.NpmLevels>(error?: any, level?: L, message?: string, meta?: any) => void;


  interface LogEntry<L extends string = Config.NpmLevels> {
    level: L;
    message: string;
    [optionName: string]: any;
  }

   interface LogMethod<L extends string = Config.NpmLevels> {
    (level: L, message: string, callback: LogCallback): Logger<L>;
    (level: L, message: string, meta: any, callback: LogCallback): Logger<L>;
    (level: L, message: string, ...meta: any[]): Logger<L>;
    (entry: LogEntry<L>): Logger<L>;
    (level: L, message: any): Logger<L>;
  }

  interface LeveledLogMethod {
    (message: string, callback: LogCallback): Logger;
    (message: string, meta: any, callback: LogCallback): Logger;
    (message: string, ...meta: any[]): Logger;
    (message: any): Logger;
    (infoObject: object): Logger;
  }

  interface LoggerOptions<L extends string = Config.NpmLevels> {
    levels?: Config.AbstractConfigSetLevels<L>;
    silent?: boolean;
    format?: logform.Format;
    level?: string;
    exitOnError?: Function | boolean;
    defaultMeta?: any;
    transports?: Transport[] | Transport;
    handleExceptions?: boolean;
    handleRejections?: boolean;
    exceptionHandlers?: any;
    RejectionHandlers?: any;
  }

  type Logger<L extends string = Config.NpmLevels> = Record<L, LeveledLogMethod> & NodeJSStream.Transform & {
    silent: boolean;
    format: logform.Format;
    levels: Config.AbstractConfigSetLevels<L>;
    level: L;
    transports: Transport[];
    exceptions: ExceptionHandler<L>;
    rejections: RejectionHandler<L>;
    profilers: object;
    exitOnError: Function | boolean;
    defaultMeta?: any;

    log: LogMethod<L>;
    add(transport: Transport): Logger<L>;
    remove(transport: Transport): Logger<L>;
    clear(): Logger<L>;
    close(): Logger<L>;

    query(options?: QueryOptions, callback?: (err: Error, results: any) => void): any;
    stream(options?: any): NodeJS.ReadableStream;

    startTimer(): Profiler<L>;
    profile(id: string | number, meta?: LogEntry<L>): Logger<L>;

    configure(options: LoggerOptions): void;

    child(options: Object): Logger<L>;

    isLevelEnabled(level: L): boolean;
    isErrorEnabled(): boolean;
    isWarnEnabled(): boolean;
    isInfoEnabled(): boolean;
    isVerboseEnabled(): boolean;
    isDebugEnabled(): boolean;
    isSillyEnabled(): boolean;

    new(options?: LoggerOptions<L>): Logger<L>;
  };

  interface Container<L extends string = Config.NpmLevels> {
    loggers: Map<string, Logger<L>>;
    options: LoggerOptions<L>;

    add(id: string, options?: LoggerOptions): Logger<L>;
    get(id: string, options?: LoggerOptions): Logger<L>;
    has(id: string): boolean;
    close(id?: string): void;

    new(options?: LoggerOptions<L>): Container<L>;
  }

  let version: string;
  let ExceptionHandler: ExceptionHandler;
  let RejectionHandler: RejectionHandler;
  let Container: Container;
  let loggers: Container;

  let addColors: (target: Config.AbstractConfigSetColors) => any;
  let createLogger: <L extends string = Config.NpmLevels>(options?: LoggerOptions<L>) => Logger<L>;

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
  let query: (options?: QueryOptions, callback?: (err: Error, results: any) => void) => any;
  let stream: (options?: any) => NodeJS.ReadableStream;
  let add: (transport: Transport) => Logger;
  let remove: (transport: Transport) => Logger;
  let clear: () => Logger;
  let startTimer: () => Profiler;
  let profile: (id: string | number) => Logger;
  let configure: (options: LoggerOptions) => void;
  let child: (options: Object) => Logger;
  let level: Config.NpmLevels;
  let exceptions: ExceptionHandler;
  let rejections: RejectionHandler;
  let exitOnError: Function | boolean;
  // let default: object;
}

export = winston;
