const crypto = require('crypto');

/**
 * Client class to handle HTTP requests with Basic Authentication using MD5 encryption.
 */
class DotdigitalApi {
    /**
     * Creates an instance of Client.
     * @param {string} baseURL - The base URL for the API.
     * @param {string} username - The username for authentication.
     * @param {string} password - The password for authentication.
     * @param {object} [logger=console] - Optional custom logger.
     */
    constructor(baseURL, username, password, logger = console) {
        this.baseURL = baseURL;
        this.username = username;
        this.password = password;
        this.logger = logger;
    }

    /**
     * Makes an HTTP request.
     * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, PATCH).
     * @param {string} endpoint - The API endpoint.
     * @param {object} [params={}] - The query parameters.
     * @param {object} [body=null] - The request body.
     * @returns {Promise<object>} - The response data.
     * @throws Will throw an error if the HTTP request fails.
     */
    async request(method, endpoint, params = {}, body = null) {
        //method = 'GET';
        //endpoint = 'programs';
        //params = {};
        //body = null;
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const options = {
            method: method,
            headers: {
                'Authorization': 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} Body ${options.body}`);
                // throw new Error(`HTTP error! status: ${response.status}, url: ${url} auth: ${Buffer.from(this.username + ':' + this.password).toString('base64')}`);
            }
            return await response.json();
        } catch (error) {
            this.logger.error(`Error making ${method} request:`, error);
            throw error;
        }
    }

    /**
     * Makes a GET request.
     * @param {string} endpoint - The API endpoint.
     * @param {object} [params={}] - The query parameters.
     * @returns {Promise<object>} - The response data.
     */
    get(endpoint, params = {}) {
        return this.request('GET', endpoint, params);
    }

    /**
     * Makes a POST request.
     * @param {string} endpoint - The API endpoint.
     * @param {object} body - The request body.
     * @param {object} [params={}] - The query parameters.
     * @returns {Promise<object>} - The response data.
     */
    post(endpoint, body, params = {}) {
        return this.request('POST', endpoint, params, body);
    }

    /**
     * Makes a PUT request.
     * @param {string} endpoint - The API endpoint.
     * @param {object} body - The request body.
     * @param {object} [params={}] - The query parameters.
     * @returns {Promise<object>} - The response data.
     */
    put(endpoint, body, params = {}) {
        return this.request('PUT', endpoint, params, body);
    }

    /**
     * Makes a DELETE request.
     * @param {string} endpoint - The API endpoint.
     * @param {object} [params={}] - The query parameters.
     * @returns {Promise<object>} - The response data.
     */
    delete(endpoint, params = {}) {
        return this.request('DELETE', endpoint, params);
    }

    /**
     * Makes a PATCH request.
     * @param {string} endpoint - The API endpoint.
     * @param {object} body - The request body.
     * @param {object} [params={}] - The query parameters.
     * @returns {Promise<object>} - The response data.
     */
    patch(endpoint, body, params = {}) {
        return this.request('PATCH', endpoint, params, body);
    }
}

module.exports = {DotdigitalApi};