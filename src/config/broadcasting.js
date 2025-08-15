// broadcast.config.js
require('dotenv').config();

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    */
    default: process.env.BROADCAST_DRIVER || 'null',

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    */
    connections: {
        pusher: {
            driver: 'pusher',
            key: process.env.PUSHER_APP_KEY,
            secret: process.env.PUSHER_APP_SECRET,
            appId: process.env.PUSHER_APP_ID,
            options: {
                cluster: process.env.PUSHER_APP_CLUSTER,
                host:
                    process.env.PUSHER_HOST ||
                    `api-${process.env.PUSHER_APP_CLUSTER || 'mt1'}.pusher.com`,
                port: parseInt(process.env.PUSHER_PORT || 443, 10),
                scheme: process.env.PUSHER_SCHEME || 'https',
                encrypted: true,
                useTLS: (process.env.PUSHER_SCHEME || 'https') === 'https',
            },
            clientOptions: {
                // Example: { timeout: 5000 }
            },
        },

        ably: {
            driver: 'ably',
            key: process.env.ABLY_KEY,
        },

        redis: {
            driver: 'redis',
            connection: 'default',
            // You might use ioredis or node-redis for implementation
        },

        log: {
            driver: 'log',
        },

        null: {
            driver: 'null',
        },
    },
};
