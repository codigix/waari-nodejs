const express = require('express');

/**
 * Middleware to configure trusted proxies for the application.
 * This is useful when the application is behind a reverse proxy.
 */
function trustProxies(app) {
    // Set the trusted proxies for the application
    // You can specify specific proxy IPs or ranges if needed
    app.set('trust proxy', [
        'loopback', // Trust localhost (127.0.0.1)
        'linklocal', // Trust link-local addresses (169.254.0.0/16)
        'uniquelocal' // Trust unique local addresses (fc00::/7)
    ]);

    // Optionally, you can configure headers for detecting proxies
    app.set('trust proxy headers', [
        'X-Forwarded-For',
        'X-Forwarded-Host',
        'X-Forwarded-Port',
        'X-Forwarded-Proto',
        'X-Forwarded-Aws-Elb'
    ]);
}

module.exports = trustProxies;