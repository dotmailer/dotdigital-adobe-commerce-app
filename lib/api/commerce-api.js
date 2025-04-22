require('dotenv').config()
const { getAdobeCommerceClient } = require('../adobe-commerce')

class CommerceApi {
  /**
   * Creates an instance of Client.
   * @param {object} options - oauth1 or ims options
   * @param {object} [logger] - Optional custom logger.
   */
  constructor (options, logger = console) {
    this.logger = logger
    this.storeConfigs = null
    this.authOptions = { ...options }
  }

  async init () {
    if (!this.commerceClient) {
      this.commerceClient = await getAdobeCommerceClient(this.authOptions)
    }
  }

  async getStoreConfigs () {
    await this.init()
    const res = await this.commerceClient.get('store/storeConfigs')
    if (!res.success) {
      throw new Error(`Could not get store configs: ${JSON.stringify(res)}`)
    }
    return res.message
  }

  async getStoreViews () {
    await this.init()
    const res = await this.commerceClient.get('store/storeViews')
    if (!res.success) {
      throw new Error(`Could not get store views: ${JSON.stringify(res)}`)
    }
    return res.message
  }

  async getWebsites () {
    await this.init()
    const res = await this.commerceClient.get('store/websites')
    if (!res.success) {
      throw new Error(`Could not get websites: ${JSON.stringify(res)}`)
    }
    return res.message
  }

  /**
   * Fetches a customer by ID.
   * @param {number} customerId - The ID of the customer to fetch.
   * @returns {Promise<object>} - The customer object.
   */
  async getCustomer (customerId) {
    await this.init()
    const res = await this.commerceClient.get(`customers/${customerId}`)
    if (!res.success) {
      throw new Error(`Could not get customer: ${JSON.stringify(res)}`)
    }
    return res.message
  }

  /**
   * Fetches a group by ID.
   * @param {number} groupId - The ID of the group to fetch.
   * @returns {Promise<object>} - The customer object.
   */
  async getCustomerGroup (groupId) {
    await this.init()
    const res = await this.commerceClient.get(`customerGroups/${groupId}`)
    if (!res.success) {
      throw new Error(`Could not get customer group: ${JSON.stringify(res)}`)
    }
    return res.message
  }

  /**
   * Get store URL.
   * @param {number} storeId commerce store id
   * @param {string} type link type
   * @param {boolean} secure return secure version
   * @returns {string} store url
   */
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

    for (const website of websites) {
      if (website.id === websiteId) {
        return website.name
      }
    }
    return 'Website name not found'
  }
}

module.exports = { CommerceApi }
