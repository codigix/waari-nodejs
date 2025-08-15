// cors.config.js
require('dotenv').config();

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */
    paths: ['*', 'sanctum/csrf-cookie'],

    allowedMethods: ['*'], // ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

    allowedOrigins: ['*'], // Or restrict: ['https://example.com']

    allowedOriginsPatterns: [], // Regex patterns for origins

    allowedHeaders: ['*'], // Or specific: ['Content-Type', 'Authorization']

    exposedHeaders: [], // Headers browsers can access

    maxAge: 0, // Seconds browsers can cache preflight responses

    supportsCredentials: false, // Send cookies/auth headers cross-origin
};
