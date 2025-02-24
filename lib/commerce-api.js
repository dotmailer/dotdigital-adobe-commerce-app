const { OauthClient } = require('./oauth1.js')

class CommerceApi extends OauthClient {
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
   * @param {object} [logger] - Optional custom logger.
   */
  constructor (options, logger = console) {
    options.version = 'V1'
    options.url = options.url + 'rest/'

    super(options, logger)
    this.logger = logger
      this.storeConfigs = null
  }

  async getStoreDetails () {
    const storeDetails = {}
    storeDetails.storeConfigs = await this.getStoreConfigs()
    storeDetails.storeViews = await this.getStoreViews()
    storeDetails.websites = await this.getWebsites()
    return storeDetails
  }

  async getStoreConfigs () {
    return await this.get(
      'store/storeConfigs'
    )
  }

  async getStoreViews () {
    return await this.get(
      'store/storeViews'
    )
  }

  async getWebsites () {
    return await this.get(
      'store/websites'
    )
  }

  /**
   * Fetches a customer by ID.
   * @param {number} customerId - The ID of the customer to fetch.
   * @returns {Promise<object>} - The customer object.
   */
  async getCustomer (customerId) {
    return await this.get(`customers/${customerId}`)
  }

	/**
	 * Fetches a group by ID.
	 * @param {number} customerId - The ID of the group to fetch.
	 * @returns {Promise<object>} - The customer object.
	 */
	async getCustomerGroup(groupId) {
		return await this.get(`customerGroups/${groupId}`);
	}

    async getStoreUrl (storeId, type = 'base', secure = true) {
        if (!this.storeConfigs) {
            this.storeConfigs = await this.getStoreConfigs()
        }

        let linkProperty = 'base_url'
        switch (type) {
            case 'link':
                linkProperty = 'base_link_url'
                break
            case 'static':
                linkProperty = 'base_static_url'
                break
            case 'media':
                linkProperty = 'base_media_url'
                break
            default:
                break
        }

        for (const storeConfig of this.storeConfigs) {
            if (parseInt(storeConfig.id) === parseInt(storeId)) {
                if (secure) {
                    return (storeConfig[`secure_${linkProperty}`]) ? storeConfig[`secure_${linkProperty}`] : storeConfig[linkProperty]
                } else {
                    return storeConfig[linkProperty]
                }
            }
        }
    }


}

module.exports = {CommerceApi};