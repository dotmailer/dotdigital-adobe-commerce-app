require('dotenv').config()
const {OauthClient} = require("./oauth1.js");

class CommerceApi extends OauthClient{

    /**
     * Creates an instance of Client.
     * @param {object} options - oauth keys {
     *       url: params.COMMERCE_BASE_URL,
     *       consumerKey: params.COMMERCE_CONSUMER_KEY,
     *       consumerSecret: params.COMMERCE_CONSUMER_SECRET,
     *       accessToken: params.COMMERCE_ACCESS_TOKEN,
     *       accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET
     *       adminToken: params.COMMERCE_ADMIN_TOKEN
     *     }.
     * @param {object} [logger=console] - Optional custom logger.
     */
    constructor(options, logger=console) {

        options.version = 'V1';
        options.url = options.url + 'rest/';

        super(options, logger);
        this.logger = logger;
    }

    async getStoreDetails() {
        let storeDetails = {};
        storeDetails.storeConfigs = await this.getStoreConfigs();
        storeDetails.storeViews = await this.getStoreViews();
        storeDetails.websites = await this.getWebsites();
        return storeDetails;
    }

    async getStoreConfigs() {
        return await this.get(
            'store/storeConfigs',
        );
    }

    async getStoreViews() {
        return await this.get(
            'store/storeViews',
        );
    }

    async getWebsites() {
        return await this.get(
            'store/websites',
        );
    }

	/**
	 * Fetches a customer by ID.
	 * @param {number} customerId - The ID of the customer to fetch.
	 * @returns {Promise<object>} - The customer object.
	 */
	async getCustomer(customerId) {
		return await this.get(`customers/${customerId}`);
	}

	/**
	 * Fetches a group by ID.
	 * @param {number} customerId - The ID of the group to fetch.
	 * @returns {Promise<object>} - The customer object.
	 */
	async getCustomerGroup(groupId) {
		return await this.get(`customerGroups/${groupId}`);
	}


}

module.exports = {CommerceApi};
