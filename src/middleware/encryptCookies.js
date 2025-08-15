// encryptCookies.js

class EncryptCookies {
    /**
     * The names of the cookies that should not be encrypted.
     *
     * @type {Array<string>}
     */
    constructor() {
        this.except = [];
    }

    /**
     * Add a cookie name to the exception list.
     *
     * @param {string} cookieName
     */
    addException(cookieName) {
        this.except.push(cookieName);
    }

    /**
     * Check if a cookie is in the exception list.
     *
     * @param {string} cookieName
     * @returns {boolean}
     */
    isException(cookieName) {
        return this.except.includes(cookieName);
    }
}

module.exports = EncryptCookies;