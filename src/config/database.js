// database.config.js
require('dotenv').config();
const slugify = require('slugify');
const path = require('path');

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    | Supabase uses PostgreSQL, so we set default to 'pgsql'
    */
    default: process.env.DB_CONNECTION || 'pgsql',

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    */
    connections: {
        pgsql: {
            driver: 'pgsql',
            url: process.env.DATABASE_URL, // optional full connection string
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_DATABASE || 'postgres',
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8',
            prefix: '',
            prefixIndexes: true,
            searchPath: 'public',
            sslmode: 'require', // Supabase requires SSL
        },

        // Keeping SQLite only if you need it locally
        sqlite: {
            driver: 'sqlite',
            url: process.env.DATABASE_URL,
            database: process.env.DB_DATABASE || path.join(__dirname, 'database.sqlite'),
            prefix: '',
            foreignKeyConstraints: process.env.DB_FOREIGN_KEYS !== 'false',
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    */
    migrations: 'migrations',

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    */
    redis: {
        client: process.env.REDIS_CLIENT || 'redis',
        options: {
            cluster: process.env.REDIS_CLUSTER || 'redis',
            prefix:
                process.env.REDIS_PREFIX ||
                slugify(process.env.APP_NAME || 'nodeapp', { lower: true, replacement: '_' }) + '_database_',
        },
        default: {
            url: process.env.REDIS_URL,
            host: process.env.REDIS_HOST || '127.0.0.1',
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            database: parseInt(process.env.REDIS_DB || '0', 10),
        },
        cache: {
            url: process.env.REDIS_URL,
            host: process.env.REDIS_HOST || '127.0.0.1',
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            database: parseInt(process.env.REDIS_CACHE_DB || '1', 10),
        },
    },
};
