// app/appServices/appServiceappService.js

class appService {
  register(app) {
    // Register application-wide services here
    // Example: database connection, logger, etc.
    console.log("Registering services...");
  }

  boot(app) {
    // Bootstrapping logic for the application
    // Example: load routes, middleware, etc.
    console.log("Bootstrapping application...");
  }
}

export default new appService();