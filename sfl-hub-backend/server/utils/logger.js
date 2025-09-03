import winston from 'winston';
import LokiTransport from 'winston-loki';

const Loki_URL = process.env.LOKI_URL;

// console.log("Loki_url:", Loki_URL);

const logger = winston.createLogger({
  transports: [
    new LokiTransport({
      host: Loki_URL, 
      labels: { job: 'SFL_Prod', panel: 'RecentLogin' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      interval: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: () => new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }),
        winston.format.json()
      )
    }),

    new LokiTransport({
      host: Loki_URL,
      labels: { job: 'SFL_Prod', panel: 'Shipment' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      interval: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: () => new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }),
        winston.format.json()
      )
    })
  ]
});

export default logger;