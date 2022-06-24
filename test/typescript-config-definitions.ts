import type { CliConfigSetColors, CliConfigSetLevels, NpmConfigSetColors, NpmConfigSetLevels, SyslogConfigSetColors, SyslogConfigSetLevels } from '../lib/winston/config';

/** Config Types */
const cliConfigLevels: CliConfigSetLevels = {
  error: 0,
  warn: 0,
  help: 0,
  data: 0,
  info: 0,
  debug: 0,
  prompt: 0,
  verbose: 0,
  input: 0,
  silly: 0
}

const cliConfigColors: CliConfigSetColors = {
  error: "",
  warn: "",
  help: "",
  data: "",
  info: "",
  debug: "",
  prompt: "",
  verbose:"",
  input: [""],
  silly: ["", ""]
}

const npmLogLevels: NpmConfigSetLevels = {
  error: 0,
  warn: 0,
  info: 0,
  http: 0,
  verbose: 0,
  debug: 0,
  silly: 0
}

const npmColors: NpmConfigSetColors = {
  error: "",
  warn: "",
  info: "",
  http: "",
  verbose: "",
  debug: [""],
  silly: ["", ""]
}

const syslogLevels: SyslogConfigSetLevels = {
  emerg: 0,
  alert: 0,
  crit: 0,
  error: 0,
  warning: 0,
  notice: 0,
  info: 0,
  debug: 0
}

const syslogColors: SyslogConfigSetColors = {
  emerg: "",
  alert: "",
  crit: "",
  error: "",
  warning: "",
  notice: "",
  info: [""],
  debug: ["", ""]
}