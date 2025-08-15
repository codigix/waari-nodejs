// sanctum.config.js
require('dotenv').config();

const defaultStatefulDomains = [
  'localhost',
  'localhost:3000',
  '127.0.0.1',
  '127.0.0.1:8000',
  '::1',
  // If your app has a base URL with port
  process.env.APP_URL ? new URL(process.env.APP_URL).host : null,
].filter(Boolean);

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Stateful Domains
  |--------------------------------------------------------------------------
  | Requests from these domains/hosts will receive stateful API authentication
  | cookies (like Sanctum in Laravel). Use this for SPA frontends.
  */
  stateful: (process.env.SANCTUM_STATEFUL_DOMAINS || defaultStatefulDomains.join(','))
    .split(',')
    .map(domain => domain.trim()),

  /*
  |--------------------------------------------------------------------------
  | Guards (Auth Strategies)
  |--------------------------------------------------------------------------
  | Similar to Laravel, these define the auth strategies we check.
  | In Node, this might map to Passport strategies, JWT middleware, etc.
  */
  guards: ['session', 'jwt'],

  /*
  |--------------------------------------------------------------------------
  | Token Expiration (Minutes)
  |--------------------------------------------------------------------------
  | Null = never expires. Otherwise, integer in minutes.
  */
  expiration: process.env.SANCTUM_EXPIRATION
    ? parseInt(process.env.SANCTUM_EXPIRATION, 10)
    : null,

  /*
  |--------------------------------------------------------------------------
  | Middleware
  |--------------------------------------------------------------------------
  | Map Laravel’s CSRF & cookie encryption to Node/Express middleware.
  */
  middleware: {
    verifyCsrfToken: require('csurf')({ cookie: true }), // Equivalent to VerifyCsrfToken
    encryptCookies: require('cookie-encrypter')(process.env.COOKIE_SECRET || 'default_secret'), // Equivalent to EncryptCookies
  },
};
