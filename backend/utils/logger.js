const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const SENSITIVE_FIELDS = new Set(['password', 'confirmPassword', 'token', 'refreshToken', 'apiKey', 'secret', 'authorization']);

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[k] = sanitize(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitize(meta),
  });
}

const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

function log(level, message, meta) {
  const levelNum = LOG_LEVELS[level] ?? LOG_LEVELS.INFO;
  if (levelNum > currentLevel) return;
  const formatted = formatLog(level, message, meta);
  if (level === 'ERROR') console.error(formatted);
  else if (level === 'WARN') console.warn(formatted);
  else console.log(formatted);
}

export const logger = {
  error: (msg, meta) => log('ERROR', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  info: (msg, meta) => log('INFO', msg, meta),
  debug: (msg, meta) => log('DEBUG', msg, meta),
};

export default logger;
