// hashing.config.js
require('dotenv').config();

module.exports = {
  // Default hash driver
  driver: process.env.HASH_DRIVER || 'bcrypt', // options: bcrypt, argon, argon2id

  // Bcrypt options
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },

  // Argon options
  argon: {
    memoryCost: 65536, // in KiB
    parallelism: 1,    // threads
    timeCost: 4,       // iterations
  },
};
