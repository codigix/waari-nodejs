// services.config.js
require('dotenv').config();

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Mailgun
  |--------------------------------------------------------------------------
  */
  mailgun: {
    domain: process.env.MAILGUN_DOMAIN,
    secret: process.env.MAILGUN_SECRET,
    endpoint: process.env.MAILGUN_ENDPOINT || 'api.mailgun.net',
    scheme: 'https',
  },

  /*
  |--------------------------------------------------------------------------
  | Postmark
  |--------------------------------------------------------------------------
  */
  postmark: {
    token: process.env.POSTMARK_TOKEN,
  },

  /*
  |--------------------------------------------------------------------------
  | AWS SES
  |--------------------------------------------------------------------------
  */
  ses: {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  },
};
