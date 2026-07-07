type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PII_PATTERNS = [
  /\b\d{4}-\d{4}-\d{5}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
];

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    return PII_PATTERNS.reduce(
      (acc, pattern) => acc.replace(pattern, '[REDACTED]'),
      value
    );
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitize(v),
      ])
    );
  }
  return value;
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === 'production') {
    return level === 'warn' || level === 'error';
  }
  return true;
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;
  const payload = meta !== undefined ? sanitize(meta) : undefined;
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;
  if (payload !== undefined) {
    fn(`[${level.toUpperCase()}] ${message}`, payload);
  } else {
    fn(`[${level.toUpperCase()}] ${message}`);
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (messageOrMeta: string | unknown, meta?: unknown) => {
    if (typeof messageOrMeta === 'string') {
      write('error', messageOrMeta, meta);
    } else {
      write('error', 'Error', messageOrMeta);
    }
  },
};
