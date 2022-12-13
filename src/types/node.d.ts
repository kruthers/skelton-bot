/* eslint-disable no-var */
declare namespace globalThis {
  var log: {
    level: "info"|"debug"|"silly";
    messages: boolean;
    commands: boolean;
  }
  var colours: {
    error: number;
    success: number;
    warn: number;
    standby: number;
    neutral: number;
  }
  var colors: {
    error: number;
    success: number;
    warn: number;
    standby: number;
    neutral: number;
  }
}