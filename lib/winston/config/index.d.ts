// Type definitions for winston 3.0
// Project: https://github.com/winstonjs/winston

/// <reference types="node" />

declare namespace winston {
  type AbstractConfigSetLevels<L extends string = string> = Record<L, number>;

  type AbstractConfigSetColors<L extends string = string> = Record<L, string|string[]>;

  interface AbstractConfigSet {
    levels: AbstractConfigSetLevels;
    colors: AbstractConfigSetColors;
  }

  type CliLevels = 'data'|'debug'|'error'|'info'|'input'|'help'|'prompt'|'silly'|'verbose'|'warn';
  type CliConfigSetLevels = AbstractConfigSetLevels<CliLevels>;
  type CliConfigSetColors = AbstractConfigSetColors<CliLevels>;

  type NpmLevels = 'debug'|'error'|'http'|'info'|'silly'|'verbose'|'warn';
  type NpmConfigSetLevels = AbstractConfigSetLevels<NpmLevels>;
  type NpmConfigSetColors = AbstractConfigSetColors<NpmLevels>;

  type SyslogLevels = 'alert'|'crit'|'debug'|'emerg'|'error'|'info'|'notice'|'warning';
  type SyslogConfigSetLevels = AbstractConfigSetLevels<SyslogLevels>;
  type SyslogConfigSetColors = AbstractConfigSetColors<SyslogLevels>;

  interface Config {
    allColors: AbstractConfigSetColors;
    cli: { levels: CliConfigSetLevels, colors: CliConfigSetColors };
    npm: { levels: NpmConfigSetLevels, colors: NpmConfigSetColors };
    syslog: { levels: SyslogConfigSetLevels, colors: SyslogConfigSetColors };

    addColors(colors: AbstractConfigSetColors): void;
  }
}

declare const winston: winston.Config;
export = winston;
