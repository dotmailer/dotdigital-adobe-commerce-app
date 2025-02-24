const { Core } = require('@adobe/aio-sdk')
const { errorResponse, checkMissingRequestInputs } = require('../../../utils')
const { CommerceApi, DotdigitalApi } = require('../../../../lib')

/**
 * Class representing the handler for patching contacts.
 */
class ContactPatchHandler {
  /**
   * Create a ContactPatchHandler.
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
    const handler = new ContactPatchHandler(params)
    return handler.main(params)
  }

  /**
   * Map contact data fields from customer data.
   * @param {object} dataFieldMapping - The mapping of data fields.
   * @param {object} customerData - The customer data.
   * @returns {Promise<object>} The mapped contact data fields.
   * @throws Will throw an error if mapping fails.
   */
  async mapContactDataFields (dataFieldMapping, customerData) {
    const dotdigitalDataFields = await this.dotdigitalApi.getContactDataFields()
    const allowedDataFields = dotdigitalDataFields.filter(
      dataField => Object.keys(dataFieldMapping).includes(dataField.name)
    ).reduce((acc, dataField) => {
      dataField.mapping = dataFieldMapping[dataField.name]
      acc.push(dataField)
      return acc
    }, [])

    const commerceCustomer = await this.commerceApi.getCustomer(customerData.id)
    const customer = Object.assign(commerceCustomer, customerData)
    const storeViews = await this.commerceApi.getStoreViews()
    const websites = await this.commerceApi.getWebsites()
    const customerGroup = await this.commerceApi.getCustomerGroup(customer.group_id)

    storeViews.forEach(storeView => {
      if (storeView.id === customer.store_id) {
        customer.store_name = storeView.name
      }
    })

    websites.forEach(website => {
      if (website.id === customer.website_id) {
        customer.website_name = website.name
      }
    })

    customer.billing_address = commerceCustomer.addresses.find(
      address => address.id === parseInt(commerceCustomer.default_billing)
    ) ?? {}

    customer.shipping_address = commerceCustomer.addresses.find(
      address => address.id === parseInt(commerceCustomer.default_shipping)
    ) ?? {}

    if (customer.extension_attributes?.is_subscribed) {
      customer.extension_attributes.is_subscribed = 'Subscribed'
    } else {
      delete customer.extension_attributes.is_subscribed
    }

    if (customerGroup) {
      customer.group = customerGroup.code
    }

    delete customer.default_billing
    delete customer.default_shipping
    delete customer.addresses
    delete customer.website_id
    delete customer.store_id

    return allowedDataFields.reduce((acc, dataField) => {
      if (dataField.mapping.split('.').length > 1) {
        const [parent, child, index] = dataField.mapping.split('.')
        if (customer[parent] && customer[parent][child]) {
          if (index) {
            acc[dataField.name] = customer[parent][child][index]
          } else {
            acc[dataField.name] = customer[parent][child]
          }
        }
        return acc
      }
      if (customer[dataField.mapping]) {
        acc[dataField.name] = customer[dataField.mapping]
      }
      return acc
    }, {})
  }

  /**
   * Main function to create or update a contact in Dotdigital.
   * @param {object} params - The parameters for the handler.
   * @returns {Promise<object>} The result of the contact creation or update.
   */
  async main (params) {
    try {
      const dataFieldMapping = JSON.parse(params.DOTDIGITAL_DATAFIELD_MAPPING)
      const customerData = params.data.value
      const requiredParams = ['id', 'email']
      const errorMessage = checkMissingRequestInputs(customerData, requiredParams)
      if (errorMessage) {
        return errorResponse(400, errorMessage + JSON.stringify(customerData), this.logger)
      }

      const contact = {
        matchIdentifier: 'email',
        identifiers: {
          email: customerData.email
        },
        dataFields: await this.mapContactDataFields(dataFieldMapping, customerData),
        lists: customerData.lists || [Number(params.DOTDIGITAL_LIST_CUSTOMER)]
      }

      const dotdigitalContact = await this.dotdigitalApi.patchContactByEmail(customerData.email, contact)

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
exports.main = (params) => ContactPatchHandler.invoke(params)
