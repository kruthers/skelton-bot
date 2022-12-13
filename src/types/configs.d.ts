type core_config = {
  token: string;
  log: {
    level: "info"|"debug"|"silly";
    messages: boolean;
    commands: boolean;
  }
}
