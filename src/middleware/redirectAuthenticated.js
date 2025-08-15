const { HOME } = require('../providers/RouteServiceProvider');
const { checkAuthenticated } = require('../utils/authUtils');

/**
 * Middleware to redirect authenticated users.
 *
 * @param {string[]} guards - Array of guard names.
 * @returns {Function} Express middleware function.
 */
function redirectIfAuthenticated(...guards) {
    return (req, res, next) => {
        const activeGuards = guards.length === 0 ? [null] : guards;

        for (const guard of activeGuards) {
            if (checkAuthenticated(req, guard)) {
                return res.redirect(HOME);
            }
        }

        next();
    };
}

module.exports = redirectIfAuthenticated;