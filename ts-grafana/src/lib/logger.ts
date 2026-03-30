type Level = "info" | "warn" | "error" | "debug";

function line(level: Level, msg: string, extra?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...extra,
  };
  const fn = level === "error" ? console.error : console.log;
  fn(JSON.stringify(entry));
}

export const log = {
  info: (msg: string, extra?: Record<string, unknown>) => line("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => line("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => line("error", msg, extra),
  debug: (msg: string, extra?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === "debug") line("debug", msg, extra);
  },
};
