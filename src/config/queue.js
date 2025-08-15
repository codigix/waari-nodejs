// queue.config.js
require('dotenv').config();
const Bull = require('bull');
const AWS = require('@aws-sdk/client-sqs');
const FiveBeans = require('fivebeans');

const defaultQueue = process.env.QUEUE_CONNECTION || 'database';

const connections = {
  sync: {
    driver: 'sync',
    dispatch: async (jobFn, data) => jobFn(data),
  },

  database: {
    driver: 'database',
    table: 'jobs',
    queue: 'default',
    retryAfter: 90,
    afterCommit: false,
    // Here you would implement Supabase/Postgres-backed queue logic
  },

  beanstalkd: {
    driver: 'beanstalkd',
    host: 'localhost',
    queue: 'default',
    retryAfter: 90,
    blockFor: 0,
    afterCommit: false,
    client: new FiveBeans.client('127.0.0.1', 11300),
  },

  sqs: {
    driver: 'sqs',
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    prefix: process.env.SQS_PREFIX || 'https://sqs.us-east-1.amazonaws.com/your-account-id',
    queue: process.env.SQS_QUEUE || 'default',
    suffix: process.env.SQS_SUFFIX,
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    afterCommit: false,
    client: new AWS.SQSClient({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' }),
  },

  redis: {
    driver: 'redis',
    connection: 'default',
    queue: process.env.REDIS_QUEUE || 'default',
    retryAfter: 90,
    blockFor: null,
    afterCommit: false,
    client: new Bull(process.env.REDIS_QUEUE || 'default', {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || 6379, 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
  },

  null: {
    driver: 'null',
    dispatch: async () => {
      console.log('Job discarded (null driver).');
    },
  },
};

const batching = {
  database: process.env.DB_CONNECTION || 'pgsql', // switched to Postgres
  table: 'job_batches',
};

const failed = {
  driver: process.env.QUEUE_FAILED_DRIVER || 'database-uuids',
  database: process.env.DB_CONNECTION || 'pgsql', // switched to Postgres
  table: 'failed_jobs',
};

module.exports = {
  default: defaultQueue,
  connections,
  batching,
  failed,
};
