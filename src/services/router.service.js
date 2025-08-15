// app/s/routeService.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const apiRoutes = require("../../routes/api");
const webRoutes = require("../../routes/web");

class RouteService {
  constructor(app) {
    this.app = app;
    this.HOME = "/home"; // Laravel's public const HOME
  }

  boot() {
    // Laravel's RateLimiter::for('api', ...)
    const apiLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // limit each IP to 60 requests per windowMs
      keyGenerator: (req) => (req.user?.id || req.ip), // Like Laravel's ->by()
    });

    // API routes
    this.app.use("/api", apiLimiter, apiRoutes);

    // Web routes
    this.app.use("/", webRoutes);

    console.log("RouteService booted: routes registered");
  }
}

module.exports = RouteService;
