const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters } = require('../../../utils')
const { getSubscriberStatusString } = require('../../../../utils/subscriber-status')
const { CommerceApi, DotdigitalApi } = require('../../../../lib')

class SubscriberConsumer {
  /**
   * Create a SubscriberConsumer.
   * @param {object} params - The parameters for the handler.
   */
  constructor (params) {
    this.logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

    this.commerceApi = new CommerceApi({
      url: params.COMMERCE_BASE_URL,
      consumerKey: params.COMMERCE_CONSUMER_KEY,
      consumerSecret: params.COMMERCE_CONSUMER_SECRET,
      accessToken: params.COMMERCE_ACCESS_TOKEN,
      accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET
    }, this.logger)
    this.dotdigitalApi = new DotdigitalApi(
      params.DOTDIGITAL_API_URL,
      params.DOTDIGITAL_API_USER,
      params.DOTDIGITAL_API_PASSWORD,
      this.logger
    )
  }

  /**
   * Static method to invoke the main function.
   * @param {object} params - The parameters for the handler.
   * @returns {Promise<object>} The result of the main function.
   */
  static async invoke (params) {
    const handler = new SubscriberConsumer(params)
    return handler.main(params)
  }

  /**
   * This is the consumer of the events coming from Adobe Commerce related to the subscriber entity.
   *
   * @returns {object} returns response object with status code, request data received and response of the invoked action
   * @param {object} params - includes the env params, type and the data of the event
   */
  async main (params) {
    try {
      this.logger.info(`Consumer main params: ${stringParameters(params)}`)

      const subscriberData = params.data.value
      const eventMetaData = params.data._metadata
      const matchIdentifier = 'email'
      const identifier = subscriberData.subscriber_email
      const storeId = subscriberData.store_id
      const websiteId = Number(eventMetaData.websiteId)

      const payload = {
        matchIdentifier,
        identifiers: { email: identifier },
        dataFields: {
          SUBSCRIBER_STATUS: getSubscriberStatusString(subscriberData.subscriber_status),
          STORE_NAME: await this.commerceApi.getStoreViewName(storeId),
          WEBSITE_NAME: await this.commerceApi.getWebsiteName(websiteId)
        },
        lists: [Number(params.DOTDIGITAL_LIST_SUBSCRIBER)]
      }

      this.logger.info(`Payload: ${JSON.stringify(payload)}`)

      const dotdigitalContact = await this.dotdigitalApi.patchContactByEmail(identifier, payload)

      return {
        body: {
          message: 'Contact created successfully',
          contact: dotdigitalContact
        }
      }
    } catch (error) {
      this.logger.error(error)
      return errorResponse(error?.status ?? 500, error.message, this.logger)
    }
  }
}

/**
 * Export the main function to be executed by Adobe I/O Runtime.
 * @param {object} params - The parameters for the handler.
 * @returns {Promise<object>} The result of the main function.
 */
exports.main = (params) => SubscriberConsumer.invoke(params)
