declare global {
  namespace NodeJS {
    interface Global {
      log: {
        level: "info"|"debug"|"silly";
        messages: boolean;
        commands: boolean;
      }
      colours: {
        error: number;
        success: number;
        warn: number;
        standby: number;
        neutral: number;
      }
      colors: {
        error: number;
        success: number;
        warn: number;
        standby: number;
        neutral: number;
      }
    }
  }
}