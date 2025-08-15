// src/middleware/verifyCsrfToken.js

class VerifyCsrfToken {
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @type {string[]}
     */
    constructor() {
        this.except = [];
    }

    /**
     * Middleware function to verify CSRF token.
     *
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {function} next - Express next middleware function.
     */
    handle(req, res, next) {
        const excluded = this.except.some(uri => req.path.startsWith(uri));
        if (excluded) {
            return next();
        }

        const csrfToken = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
        if (!csrfToken || csrfToken !== req.session.csrfToken) {
            return res.status(403).json({ message: 'CSRF token mismatch or missing.' });
        }

        next();
    }

    /**
     * Add URIs to be excluded from CSRF verification.
     *
     * @param {string[]} uris - Array of URIs to exclude.
     */
    exclude(uris) {
        this.except = this.except.concat(uris);
    }
}

module.exports = VerifyCsrfToken;