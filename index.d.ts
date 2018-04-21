// Type definitions for winston 3.0
// Project: https://github.com/winstonjs/winston

/// <reference types="node" />

import {Format, FormatWrap} from 'logform';
import * as Transport from 'winston-transport';
import * as stream from "stream";
import {Agent} from "http";

declare namespace winston {
    // TRANSPORTS

    interface ConsoleTransportOptions extends Transport.TransportStreamOptions {
        stderrLevels?: string[];
        debugStdout?: boolean;
        eol?: string;
    }

    interface ConsoleTransportInstance extends Transport {
        name: string;
        stderrLevels: string[];
        eol: string;

        new(options?: ConsoleTransportOptions): ConsoleTransportInstance;
    }

    interface FileTransportOptions extends Transport.TransportStreamOptions {
        filename?: string;
        dirname?: string;
        options?: object;
        maxsize?: number;
        stream?: NodeJS.WritableStream;
        rotationFormat?: Function;
        zippedArchive?: boolean;
        maxFiles?: number;
        eol?: string;
        tailable?: boolean;
    }

    interface FileTransportInstance extends Transport {
        name: string;
        filename: string;
        dirname: string;
        options: object;
        maxsize: number | null;
        rotationFormat: Function | boolean;
        zippedArchive: boolean;
        maxFiles: number | null;
        eol: string;
        tailable: boolean;

        new(options?: FileTransportOptions): FileTransportInstance;
    }

    interface HttpTransportOptions extends Transport.TransportStreamOptions {
        ssl?: any;
        host?: string;
        port?: number;
        auth?: { username: string; password: string; };
        path?: string;
        agent?: Agent;
        headers?: object;
    }

    interface HttpTransportInstance extends Transport {
        name: string;
        ssl: boolean;
        host: string;
        port: number;
        auth?: { username: string, password: string };
        path: string;
        agent?: Agent | null;

        new(options?: HttpTransportOptions): HttpTransportInstance;
    }

    interface StreamTransportOptions extends Transport.TransportStreamOptions {
        stream: NodeJS.WritableStream;
    }

    interface StreamTransportInstance extends Transport {
        new(options?: StreamTransportOptions): StreamTransportInstance;
    }

    interface Transports {
        File: FileTransportInstance;
        Console: ConsoleTransportInstance;
        Http: HttpTransportInstance;
        Stream: StreamTransportInstance;
    }

    // CONFIG

    interface AbstractConfigSetLevels {
        [key: string]: number;
    }

    interface AbstractConfigSetColors {
        [key: string]: string | string[];
    }

    interface AbstractConfigSet {
        levels: AbstractConfigSetLevels;
        colors: AbstractConfigSetColors;
    }

    interface CliConfigSetLevels extends AbstractConfigSetLevels {
        error: number;
        warn: number;
        help: number;
        data: number;
        info: number;
        debug: number;
        prompt: number;
        verbose: number;
        input: number;
        silly: number;
    }

    interface CliConfigSetColors extends AbstractConfigSetColors {
        error: string | string[];
        warn: string | string[];
        help: string | string[];
        data: string | string[];
        info: string | string[];
        debug: string | string[];
        prompt: string | string[];
        verbose: string | string[];
        input: string | string[];
        silly: string | string[];
    }

    interface NpmConfigSetLevels extends AbstractConfigSetLevels {
        error: number;
        warn: number;
        info: number;
        verbose: number;
        debug: number;
        silly: number;
    }

    interface NpmConfigSetColors extends AbstractConfigSetColors {
        error: string | string[];
        warn: string | string[];
        info: string | string[];
        verbose: string | string[];
        debug: string | string[];
        silly: string | string[];
    }

    interface SyslogConfigSetLevels extends AbstractConfigSetLevels {
        emerg: number;
        alert: number;
        crit: number;
        error: number;
        warning: number;
        notice: number;
        info: number;
        debug: number;
    }

    interface SyslogConfigSetColors extends AbstractConfigSetColors {
        emerg: string | string[];
        alert: string | string[];
        crit: string | string[];
        error: string | string[];
        warning: string | string[];
        notice: string | string[];
        info: string | string[];
        debug: string | string[];
    }

    interface Config {
        allColors: AbstractConfigSetColors;
        cli: { levels: CliConfigSetLevels, colors: CliConfigSetColors };
        npm: { levels: NpmConfigSetLevels, colors: NpmConfigSetColors };
        syslog: { levels: SyslogConfigSetLevels, colors: SyslogConfigSetColors };

        addColors(colors: AbstractConfigSetColors): void;

        colorize(level: number, message?: string): string;
    }

    // MAIN

    interface ExceptionHandler {
        logger: Logger;
        handlers: Map<any, any>;
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
        levels?: AbstractConfigSetLevels;
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
        levels: AbstractConfigSetLevels;
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
        // Transport: Transport;
        ExceptionHandler: ExceptionHandler;
        Container: Container;
        loggers: Container;

        addColors(target: AbstractConfigSetColors): any;
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