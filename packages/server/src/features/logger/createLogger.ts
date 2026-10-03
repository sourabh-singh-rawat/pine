import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import pino from "pino";
import type { ILogger } from "./ILogger";
import { PinoLogger } from "./PinoLogger";

export type CreateLoggerOptions = {
  serviceName: string;
  logDir?: string;
  retentionDays?: number;
};

const DEFAULT_RETENTION_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type TransportTarget = {
  target: string;
  level?: string;
  options?: Record<string, unknown>;
};

export const createLogger = (options: CreateLoggerOptions): ILogger => {
  const logDir = options.logDir ?? join(process.cwd(), "logs");
  const retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const isProduction = process.env.NODE_ENV === "production";
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const targets: TransportTarget[] = [];

  pruneExpiredLogs(logDir, retentionDays);

  if (isProduction) {
    targets.push({
      target: "pino/file",
      options: { destination: 1 },
    });
  } else {
    targets.push({
      target: "pino-pretty",
      options: { colorize: true },
    });
  }

  targets.push({
    target: "pino-roll",
    options: {
      file: join(logDir, "app"),
      frequency: "daily",
      mkdir: true,
      extension: ".log",
      dateFormat: "yyyy-MM-dd",
      limit: {
        count: Math.max(retentionDays - 1, 0),
        removeOtherLogFiles: true,
      },
    },
  });

  targets.push({
    target: "pino/file",
    options: {
      destination: join(logDir, "combined.log"),
      mkdir: true,
      append: true,
    },
  });

  if (otlpEndpoint !== undefined && otlpEndpoint.length > 0) {
    targets.push({
      target: "pino-opentelemetry-transport",
      options: {
        loggerName: options.serviceName,
        resourceAttributes: {
          "service.name": options.serviceName,
        },
        logRecordProcessorOptions: {
          recordProcessorType: "batch",
          exporterOptions: {
            protocol: "grpc",
          },
        },
      },
    });
  }

  return new PinoLogger(
    pino({
      level: "info",
      base: { service: options.serviceName },
      transport: { targets },
    }),
  );
};

const pruneExpiredLogs = (logDir: string, retentionDays: number) => {
  mkdirSync(logDir, { recursive: true });
  const cutoff = Date.now() - retentionDays * MS_PER_DAY;
  const combinedPath = join(logDir, "combined.log");

  if (existsSync(combinedPath)) {
    const combinedStat = statSync(combinedPath);
    if (combinedStat.birthtimeMs < cutoff) {
      unlinkSync(combinedPath);
    }
  }

  for (const name of readdirSync(logDir)) {
    if (!name.endsWith(".log") || name === "combined.log") {
      continue;
    }
    const path = join(logDir, name);
    if (statSync(path).mtimeMs < cutoff) {
      unlinkSync(path);
    }
  }
};
