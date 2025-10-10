import { createLogger, format, transports } from 'winston';

// Determine log level: UNCONFERENCE_ME_LOG_LEVEL takes precedence over NODE_ENV
const getLogLevel = (): string => {
  const customLogLevel = process.env.UNCONFERENCE_ME_LOG_LEVEL;
  if (customLogLevel) {
    return customLogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const logger = createLogger({
  level: getLogLevel(),
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${level}] [unconference-me] ${timestamp}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new transports.File({ filename: 'error.log', level: 'error' }),
          new transports.File({ filename: 'combined.log' })
        ]
      : [])
  ]
});

export default logger;