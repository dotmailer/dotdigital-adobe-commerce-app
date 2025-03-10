const { errorResponse, stringParameters } = require('../../../utils')
const { getSubscriberStatusString } = require('../../../../utils/subscriber-status')
const { mix, mixable: { hasDotdigitalClient, hasCommerceClient, hasDataFields, hasLogger } } = require('../../../mixable')

class SubscriberConsumer extends mix(class {}, [hasDotdigitalClient, hasCommerceClient, hasDataFields, hasLogger]) {
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
   * Maps contact data fields for a subscriber.
   *
   * This function filters allowed data fields, associates them with the corresponding
   * mapping, and then updates the subscriber object with the mapped data fields.
   *
   * @param {object} subscriber - The subscriber object containing subscriber details..
   * @returns {Promise<object>} - A promise that resolves to the updated subscriber object with mapped data fields.
   */
  async mapContactDataFields (subscriber) {
    const allowedDataFields = await this.filterAllowedDataFields(['SUBSCRIBER_STATUS', 'STORE_NAME', 'WEBSITE_NAME'])
    const mappedDatafields = await this.associateDataFieldsMapping(allowedDataFields, {
      SUBSCRIBER_STATUS: 'subscriber_status',
      STORE_NAME: 'store_name',
      WEBSITE_NAME: 'website_name'
    })

    subscriber.subscriber_status = getSubscriberStatusString(subscriber.subscriber_status)
    subscriber.store_name = await this.commerceApi.getStoreViewName(subscriber.store_id)
    subscriber.website_name = await this.commerceApi.getWebsiteName(subscriber.website_id)

    return this.mapAssociatedDataFields(mappedDatafields, subscriber)
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
      const identifier = subscriberData.subscriber_email

      subscriberData.websiteId = Number(eventMetaData.website_id)

      const payload = {
        matchIdentifier: 'email',
        identifiers: { email: identifier },
        dataFields: await this.mapContactDataFields(subscriberData),
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
