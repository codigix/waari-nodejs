// src/middleware/validateSignature.js

class ValidateSignature {
    /**
     * The names of the query string parameters that should be ignored.
     *
     * @type {Array<string>}
     */
    constructor() {
        this.except = [
            // 'fbclid',
            // 'utm_campaign',
            // 'utm_content',
            // 'utm_medium',
            // 'utm_source',
            // 'utm_term',
        ];
    }

    /**
     * Middleware function to validate the signature of a request.
     *
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    handle(req, res, next) {
        const queryParams = { ...req.query };

        // Remove ignored query parameters
        this.except.forEach(param => {
            delete queryParams[param];
        });

        // Add your signature validation logic here
        // Example: Validate the remaining query parameters

        // If valid, proceed to the next middleware
        next();
    }
}

module.exports = new ValidateSignature();