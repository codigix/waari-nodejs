// filesystem.config.js
require('dotenv').config();
const path = require('path');

module.exports = {
  // Default disk
  default: process.env.FILESYSTEM_DISK || 'local',

  // Disks configuration
  disks: {
    local: {
      driver: 'local',
      root: path.join(__dirname, 'storage/app'),
      throw: false,
    },

    public: {
      driver: 'local',
      root: path.join(__dirname, 'storage/app/public'),
      url: `${process.env.APP_URL}/storage`,
      visibility: 'public',
      throw: false,
    },

    s3: {
      driver: 's3',
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_DEFAULT_REGION,
      bucket: process.env.AWS_BUCKET,
      url: process.env.AWS_URL,
      endpoint: process.env.AWS_ENDPOINT,
      usePathStyleEndpoint: process.env.AWS_USE_PATH_STYLE_ENDPOINT === 'true',
      throw: false,
    },
  },

  // Symbolic links
  links: {
    [path.join(__dirname, 'public/storage')]: path.join(__dirname, 'storage/app/public'),
  },
};
