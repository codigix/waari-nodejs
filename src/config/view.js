// view.config.js
require('dotenv').config();
const path = require('path');

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | View Storage Paths
  |--------------------------------------------------------------------------
  | Paths to search for view templates. You can add multiple locations.
  */
  paths: [
    path.join(__dirname, '../resources/views'), // equivalent to resource_path('views')
  ],

  /*
  |--------------------------------------------------------------------------
  | Compiled View Path
  |--------------------------------------------------------------------------
  | Where to store compiled templates (for template engines that support it).
  */
  compiled:
    process.env.VIEW_COMPILED_PATH ||
    path.join(__dirname, '../storage/framework/views'),
};
