const levels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = levels[process.env.LOG_LEVEL || 'info'];

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(level, tag, message, data) {
  if (levels[level] < currentLevel) return;

  const color = {
    debug: colors.dim,
    info: colors.cyan,
    warn: colors.yellow,
    error: colors.red,
  }[level];

  const prefix = `${colors.dim}${timestamp()}${colors.reset} ${color}[${level.toUpperCase()}]${colors.reset} ${colors.magenta}[${tag}]${colors.reset}`;
  console.log(`${prefix} ${message}`);
  if (data) console.log(data);
}

module.exports = {
  debug: (tag, msg, data) => log('debug', tag, msg, data),
  info: (tag, msg, data) => log('info', tag, msg, data),
  warn: (tag, msg, data) => log('warn', tag, msg, data),
  error: (tag, msg, data) => log('error', tag, msg, data),
};
