// src/middleware/errorHandler.js

class PreventRequestsDuringMaintenance {
    /**
     * The URIs that should be reachable while maintenance mode is enabled.
     *
     * @type {Array<string>}
     */
    constructor() {
        this.except = [];
    }

    /**
     * Middleware function to prevent requests during maintenance mode.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    handle(req, res, next) {
        const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

        if (maintenanceMode && !this.except.includes(req.originalUrl)) {
            return res.status(503).json({ message: 'The application is under maintenance.' });
        }

        next();
    }
}

module.exports = new PreventRequestsDuringMaintenance();