require('dotenv').config()
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
   * @param groupId
   * @returns {Promise<object>} - The customer object.
   */
  async getCustomerGroup (groupId) {
    return await this.get(`customerGroups/${groupId}`)
  }

  /**
   * Get store view name
   *
   * In Commerce, the value we sync by default for STORE_NAME is the store view name.
   *
   * @param {number} storeId the store id
   * @returns {string} the store group name
   */
  async getStoreViewName (storeId) {
    const storeViews = await this.getStoreViews()

    this.logger.info(JSON.stringify(storeViews))

    for (const storeView of storeViews) {
      if (storeView.id === storeId) {
        return storeView.name
      }
    }
    return 'Store view name not found'
  }

  /**
   * Get website name
   *
   * @param {number} websiteId the website id
   * @returns {string} the website name
   */
  async getWebsiteName (websiteId) {
    const websites = await this.getWebsites()

    this.logger.info(JSON.stringify(websites))

    for (const website of websites) {
      if (website.id === websiteId) {
        return website.name
      }
    }
    return 'Website name not found'
  }
}

module.exports = { CommerceApi }
