// auth.config.js
require('dotenv').config();

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    */
    defaults: {
        guard: 'web',
        passwords: 'users',
    },

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    | In Node.js, "guards" can map to Passport strategies or middleware layers.
    */
    guards: {
        web: {
            driver: 'session', // Could be 'jwt', 'oauth', etc.
            provider: 'users',
        },
    },

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    | In Node.js, this is your User model / DB access layer.
    */
    providers: {
        users: {
            driver: 'mongoose', // or 'sequelize', etc.
            model: require('./models/User'), // Your user model file
        },
        // For raw SQL:
        // users: { driver: 'database', table: 'users' }
    },

    /*
    |--------------------------------------------------------------------------
    | Password Reset Settings
    |--------------------------------------------------------------------------
    */
    passwords: {
        users: {
            provider: 'users',
            table: 'password_reset_tokens',
            expire: 60,   // minutes
            throttle: 60, // seconds before new reset token
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    */
    passwordTimeout: 10800, // 3 hours (seconds)
};
