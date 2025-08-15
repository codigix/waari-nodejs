// mail.config.js
require('dotenv').config();
const nodemailer = require('nodemailer');
const AWS = require('@aws-sdk/client-ses');
const mg = require('nodemailer-mailgun-transport');
const postmark = require('nodemailer-postmark-transport');

const defaultMailer = process.env.MAIL_MAILER || 'smtp';

const mailers = {
  smtp: nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.mailgun.org',
    port: parseInt(process.env.MAIL_PORT || 587, 10),
    secure: (process.env.MAIL_ENCRYPTION || 'tls') === 'ssl',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  }),

  ses: nodemailer.createTransport({
    SES: new AWS.SES({ region: process.env.AWS_REGION }),
  }),

  mailgun: nodemailer.createTransport(
    mg({
      auth: {
        api_key: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
      },
    })
  ),

  postmark: nodemailer.createTransport(
    postmark({
      auth: { apiKey: process.env.POSTMARK_API_TOKEN },
    })
  ),

  sendmail: nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: process.env.MAIL_SENDMAIL_PATH || '/usr/sbin/sendmail -bs -i',
  }),

  log: {
    sendMail: (mail, callback) => {
      console.log('📧 [LOG MAILER] Email:', mail);
      callback(null, { accepted: [mail.to], response: 'Logged locally' });
    },
  },

  array: {
    emails: [],
    sendMail: function (mail, callback) {
      this.emails.push(mail);
      callback(null, { accepted: [mail.to], response: 'Stored in array' });
    },
  },

  failover: {
    sendMail: async (mail, callback) => {
      try {
        await mailers.smtp.sendMail(mail);
      } catch (err) {
        console.warn('SMTP failed, logging instead...');
        return mailers.log.sendMail(mail, callback);
      }
      callback(null, { accepted: [mail.to], response: 'Sent via SMTP' });
    },
  },
};

module.exports = {
  default: defaultMailer,
  mailers,
  from: {
    address: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
    name: process.env.MAIL_FROM_NAME || 'Example',
  },
};
