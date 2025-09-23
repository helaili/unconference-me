import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
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