/* eslint-disable no-var */
declare namespace globalThis {
  var log: {
    level: "info"|"debug"|"silly";
    messages: boolean;
    commands: boolean;
  }
  var colours: colours
  var colors: colours
}