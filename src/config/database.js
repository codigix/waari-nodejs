// database.config.js
require('dotenv').config();
const slugify = require('slugify');
const path = require('path');

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    */
    default: process.env.DB_CONNECTION || 'mysql',

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    */
    connections: {
        sqlite: {
            driver: 'sqlite',
            url: process.env.DATABASE_URL,
            database: process.env.DB_DATABASE || path.join(__dirname, 'database.sqlite'),
            prefix: '',
            foreignKeyConstraints: process.env.DB_FOREIGN_KEYS !== 'false',
        },

        mysql: {
            driver: 'mysql',
            url: process.env.DATABASE_URL,
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            database: process.env.DB_DATABASE || 'forge',
            username: process.env.DB_USERNAME || 'forge',
            password: process.env.DB_PASSWORD || '',
            unixSocket: process.env.DB_SOCKET || '',
            charset: 'utf8mb4',
            collation: 'utf8mb4_unicode_ci',
            prefix: '',
            prefixIndexes: true,
            strict: false,
            engine: null,
            options: {
                ssl: process.env.MYSQL_ATTR_SSL_CA ? { ca: process.env.MYSQL_ATTR_SSL_CA } : undefined,
            },
        },

        pgsql: {
            driver: 'pgsql',
            url: process.env.DATABASE_URL,
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_DATABASE || 'forge',
            username: process.env.DB_USERNAME || 'forge',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8',
            prefix: '',
            prefixIndexes: true,
            searchPath: 'public',
            sslmode: 'prefer',
        },

        sqlsrv: {
            driver: 'sqlsrv',
            url: process.env.DATABASE_URL,
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '1433', 10),
            database: process.env.DB_DATABASE || 'forge',
            username: process.env.DB_USERNAME || 'forge',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8',
            prefix: '',
            prefixIndexes: true,
            // encrypt: process.env.DB_ENCRYPT || 'yes',
            // trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE || 'false',
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
            prefix: process.env.REDIS_PREFIX || slugify(process.env.APP_NAME || 'nodeapp', { lower: true, replacement: '_' }) + '_database_',
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
