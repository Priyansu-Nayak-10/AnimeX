function format(level, args) {
  const timestamp = new Date().toISOString();
  const [first, ...rest] = args;
  const message = first instanceof Error ? first.message : first;
  const meta = first instanceof Error
    ? { stack: first.stack, extra: rest }
    : (rest.length ? rest : undefined);
  const payload = { level, timestamp, message, meta };
  return JSON.stringify(payload);
}

const logger = {
  info: (...args) => console.log(format('info', args)),
  warn: (...args) => console.warn(format('warn', args)),
  error: (...args) => console.error(format('error', args)),
  debug: (...args) => console.debug(format('debug', args))
};

module.exports = logger;
