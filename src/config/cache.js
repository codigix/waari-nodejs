// cache.config.js
require('dotenv').config();
const slugify = require('slugify');
const path = require('path');

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Cache Store
    |--------------------------------------------------------------------------
    */
    default: process.env.CACHE_DRIVER || 'file',

    /*
    |--------------------------------------------------------------------------
    | Cache Stores
    |--------------------------------------------------------------------------
    | In Node.js, you can implement these using different libraries:
    | - file: node-cache-fs, fs
    | - redis: ioredis / node-redis
    | - memcached: memcached package
    | - dynamodb: AWS SDK
    */
    stores: {
        apc: {
            driver: 'apc', // Not directly supported in Node.js
        },

        array: {
            driver: 'array',
            serialize: false,
        },

        database: {
            driver: 'database',
            table: 'cache',
            connection: null,
            lockConnection: null,
        },

        file: {
            driver: 'file',
            path: path.join(__dirname, 'storage', 'framework', 'cache', 'data'),
            lockPath: path.join(__dirname, 'storage', 'framework', 'cache', 'data'),
        },

        memcached: {
            driver: 'memcached',
            persistentId: process.env.MEMCACHED_PERSISTENT_ID,
            sasl: [
                process.env.MEMCACHED_USERNAME,
                process.env.MEMCACHED_PASSWORD,
            ],
            options: {
                // Example: { timeout: 2000 }
            },
            servers: [
                {
                    host: process.env.MEMCACHED_HOST || '127.0.0.1',
                    port: parseInt(process.env.MEMCACHED_PORT || 11211, 10),
                    weight: 100,
                },
            ],
        },

        redis: {
            driver: 'redis',
            connection: 'cache',
            lockConnection: 'default',
        },

        dynamodb: {
            driver: 'dynamodb',
            key: process.env.AWS_ACCESS_KEY_ID,
            secret: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
            table: process.env.DYNAMODB_CACHE_TABLE || 'cache',
            endpoint: process.env.DYNAMODB_ENDPOINT,
        },

        octane: {
            driver: 'octane',
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Cache Key Prefix
    |--------------------------------------------------------------------------
    */
    prefix: process.env.CACHE_PREFIX ||
        slugify(process.env.APP_NAME || 'nodeapp', { lower: true, replacement: '_' }) + '_cache_',
};
