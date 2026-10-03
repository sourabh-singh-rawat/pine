export interface LoggerConstructorOptions {
  level: "info";
  timestamp: boolean;
}

export interface ILogger {
  info(message: string): void;
  error(message: string): void;
}
