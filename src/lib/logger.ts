import winston from 'winston';

const customFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
  }
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), customFormat),
    }),
    // Arquivo de erros
    new winston.transports.File({
      filename: process.env.NODE_ENV === 'production' ? '/app/logs/error.log' : './logs/error.log',
      level: 'error',
    }),
    // Arquivo combinado
    new winston.transports.File({
      filename: process.env.NODE_ENV === 'production' ? '/app/logs/combined.log' : './logs/combined.log',
    }),
  ],
});
