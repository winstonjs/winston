// Type definitions for winston 3.0
// Project: https://github.com/winstonjs/winston

/// <reference types="node" />

import {Format, FormatWrap} from 'logform';
import * as Transport from 'winston-transport';
import * as Config from "./lib/winston/config";
import * as Transports from "./lib/winston/transports";
import * as stream from "stream";

declare namespace winston {
    interface ExceptionHandler {
        logger: Logger;
        handlers: Map;
        catcher: Function | boolean;

        handle(): void;
        unhandle(): void;
        getAllInfo(err: string | Error): object;
        getProcessInfo(): object;
        getOsInfo(): object;
        getTrace(err: Error): object;

        new(logger: Logger): ExceptionHandler;
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

    interface Profiler {
        logger: Logger;
        start: Date;
        done(): boolean;
    }

    type LogCallback = (error?: any, level?: string, msg?: string, meta?: any) => void;

    interface LogEntry {
        level: string;
        msg: string;
        [optionName: string]: any;
    }

    interface LogMethod {
        (level: string, msg: string, callback: LogCallback): Logger;
        (level: string, msg: string, meta: any, callback: LogCallback): Logger;
        (level: string, msg: string, ...meta: any[]): Logger;
        (entry: LogEntry): Logger;
    }

    interface LeveledLogMethod {
        (msg: string, callback: LogCallback): Logger;
        (msg: string, meta: any, callback: LogCallback): Logger;
        (msg: string, ...meta: any[]): Logger;
    }

    interface LoggerOptions {
        levels?: Config.AbstractConfigSetLevels;
        silent?: string;
        format?: Format;
        level?: string;
        exitOnError?: Function | boolean;
        transports?: Transport[] | Transport;
        exceptionHandlers?: any;
    }

    interface Logger extends stream.Transform {
        silent: boolean;
        format: Format;
        levels: Config.AbstractConfigSetLevels;
        level: string;
        transports: Transport[];
        paddings: string[];
        exceptions: ExceptionHandler;
        profilers: object;
        exitOnError: Function | boolean;

        log: LogMethod;
        add(transport: Transport): Logger;
        remove(transport: Transport): Logger;
        clear(): Logger;
        close(): Logger;

        // for cli levels
        error: LeveledLogMethod;
        warn: LeveledLogMethod;
        help: LeveledLogMethod;
        data: LeveledLogMethod;
        info: LeveledLogMethod;
        debug: LeveledLogMethod;
        prompt: LeveledLogMethod;
        verbose: LeveledLogMethod;
        input: LeveledLogMethod;
        silly: LeveledLogMethod;

        // for syslog levels only
        emerg: LeveledLogMethod;
        alert: LeveledLogMethod;
        crit: LeveledLogMethod;
        warning: LeveledLogMethod;
        notice: LeveledLogMethod;

        query(options?: QueryOptions, callback?: (err: Error, results: any) => void): any;
        stream(options?: any): NodeJS.ReadableStream;

        startTimer(): Profiler;
        profile(id: string | number): Logger;

        configure(options: LoggerOptions): void;

        new(options?: LoggerOptions): Logger;
    }

    interface Container {
        loggers: object;
        options: object;
    }

    interface Winston {
        version: string;
        transports: Transports;
        config: Config;
        Transport: Transport;
        ExceptionHandler: ExceptionHandler;
        Container: Container;
        loggers: Container;

        addColors(target: Config.AbstractConfigSetColors): any;
        format(formatFn?: Function): Format | FormatWrap;
        createLogger(options?: LoggerOptions): Logger;

        // Pass through the target methods to the default logger.
        log: LogMethod;
        query(options?: QueryOptions, callback?: (err: Error, results: any) => void): any;
        stream(options?: any): NodeJS.ReadableStream;
        add(transport: Transport): Logger;
        remove(transport: Transport): Logger;
        clear(): Logger;
        startTimer(): Profiler;
        profile(id: string | number): Logger;
        configure(options: LoggerOptions): void;
        level: string;
        exceptions: ExceptionHandler;
        paddings: string[];
        exitOnError: Function | boolean;
        "default": object;
    }
}

declare const winston: winston.Winston;
export = winston;