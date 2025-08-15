// src/middleware/trimStrings.js

class TrimStrings {
    /**
     * The names of the attributes that should not be trimmed.
     *
     * @type {Array<string>}
     */
    constructor() {
        this.except = [
            'current_password',
            'password',
            'password_confirmation',
        ];
    }

    /**
     * Middleware function to trim strings in the request body.
     *
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    handle(req, res, next) {
        if (req.body && typeof req.body === 'object') {
            req.body = this.trimStrings(req.body);
        }
        next();
    }

    /**
     * Recursively trim strings in an object, except for specified keys.
     *
     * @param {Object} obj - The object to trim.
     * @returns {Object} - The trimmed object.
     */
    trimStrings(obj) {
        const trimmed = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (this.except.includes(key)) {
                    trimmed[key] = obj[key];
                } else if (typeof obj[key] === 'string') {
                    trimmed[key] = obj[key].trim();
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    trimmed[key] = this.trimStrings(obj[key]);
                } else {
                    trimmed[key] = obj[key];
                }
            }
        }
        return trimmed;
    }
}

module.exports = new TrimStrings();