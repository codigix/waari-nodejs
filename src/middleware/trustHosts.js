// /C:/Users/ADMIN/Downloads/node_project_skeleton/src/middleware/trustHosts.js

class TrustHosts {
    /**
     * Get the host patterns that should be trusted.
     *
     * @returns {Array<string|null>}
     */
    hosts() {
        return [
            this.allSubdomainsOfApplicationUrl(),
        ];
    }

    /**
     * Get all subdomains of the application URL.
     *
     * @returns {string|null}
     */
    allSubdomainsOfApplicationUrl() {
        const appUrl = process.env.APP_URL || '';
        if (!appUrl) return null;

        try {
            const { hostname } = new URL(appUrl);
            return `*.${hostname}`;
        } catch (error) {
            console.error('Invalid APP_URL:', appUrl);
            return null;
        }
    }
}

module.exports = TrustHosts;