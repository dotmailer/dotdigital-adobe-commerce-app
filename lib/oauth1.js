const Oauth1a = require('oauth-1.0a');
const crypto = require('crypto');
const got = require('got');
require('dotenv').config();

class OauthClient {
    constructor(options, logger) {
        this.serverUrl = options.url;
        this.apiVersion = options.version;
        this.logger = logger;
        this.oauth = Oauth1a({
            consumer: {
                key: options.consumerKey,
                secret: options.consumerSecret
            },
            signature_method: 'HMAC-SHA256',
            hash_function: this.hashFunctionSha256
        });
        this.token = {
            key: options.accessToken,
            secret: options.accessTokenSecret
        };
        this.adminToken = options.adminToken
    }

    hashFunctionSha256(baseString, key) {
        return crypto.createHmac('sha256', key).update(baseString).digest('base64');
    }

    async apiCall(requestData, requestToken = '', customHeaders = {}) {
        try {
            this.logger.debug('Fetching URL: ' + requestData.url + ' with method: ' + requestData.method);

            if (requestToken === '' && this.adminToken) {
                requestToken = this.adminToken;
            }
            const headers = {
                ...(requestToken
                    ? { Authorization: 'Bearer ' + requestToken }
                    : this.oauth.toHeader(this.oauth.authorize(requestData, this.token))),
                ...customHeaders
            };
            this.logger.debug('oauth headers: ', headers);

            return await got(requestData.url, {
                http2: true,
                method: requestData.method,
                headers,
                body: requestData.body,
                responseType: 'json'
            }).json();
        } catch (error) {
            this.logger.error(`Error fetching URL ${requestData.url}: ${error}`);
            throw error;
        }
    }

    createUrl(resourceUrl) {
        return this.serverUrl + this.apiVersion + '/' + resourceUrl;
    }

    async consumerToken(loginData) {
        return this.apiCall({
            url: this.createUrl('integration/customer/token'),
            method: 'POST',
            body: loginData
        });
    }

    async get(resourceUrl, requestToken = '') {
        const requestData = {
            url: this.createUrl(resourceUrl),
            method: 'GET'
        };
        return this.apiCall(requestData, requestToken);
    }

    async post(resourceUrl, data, requestToken = '', customHeaders = {}) {
        const requestData = {
            url: this.createUrl(resourceUrl),
            method: 'POST',
            body: data
        };
        return this.apiCall(requestData, requestToken, customHeaders);
    }

    async put(resourceUrl, data, requestToken = '', customHeaders = {}) {
        const requestData = {
            url: this.createUrl(resourceUrl),
            method: 'PUT',
            body: data
        };
        return this.apiCall(requestData, requestToken, customHeaders);
    }

    async delete(resourceUrl, requestToken = '') {
        const requestData = {
            url: this.createUrl(resourceUrl),
            method: 'DELETE'
        };
        return this.apiCall(requestData, requestToken);
    }
}

module.exports = {OauthClient};