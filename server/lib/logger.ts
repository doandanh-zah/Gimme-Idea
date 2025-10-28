type LogLevel = "debug" | "info" | "warn" | "error"

const logLevelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const configuredLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info"

const isEnabled = (level: LogLevel) =>
  logLevelPriority[level] >= logLevelPriority[configuredLevel]

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (isEnabled("debug")) {
      console.debug(message, meta ?? "")
    }
  },
  info: (message: string, meta?: unknown) => {
    if (isEnabled("info")) {
      console.info(message, meta ?? "")
    }
  },
  warn: (message: string, meta?: unknown) => {
    if (isEnabled("warn")) {
      console.warn(message, meta ?? "")
    }
  },
  error: (message: string, meta?: unknown) => {
    if (isEnabled("error")) {
      console.error(message, meta ?? "")
    }
  },
}
