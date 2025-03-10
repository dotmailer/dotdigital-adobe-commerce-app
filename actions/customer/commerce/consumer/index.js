const { errorResponse, checkMissingRequestInputs } = require('../../../utils')
const { mix, mixable: { hasDotdigitalClient, hasCommerceClient, hasDataFields, hasLogger } } = require('../../../mixable')

/**
 * Class representing the handler for patching contacts.
 */
class ContactPatchHandler extends mix(class {}, [hasDotdigitalClient, hasCommerceClient, hasDataFields, hasLogger]) {
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
   * @param {object} customer - The customer data.
   * @returns {Promise<object>} The mapped contact data fields.
   * @throws Will throw an error if mapping fails.
   */
  async mapContactDataFields (dataFieldMapping, customer) {
    const allowedDataFields = await this.filterAllowedDataFields(Object.keys(dataFieldMapping))
    const mappedDatafields = await this.associateDataFieldsMapping(allowedDataFields, dataFieldMapping)
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

    customer.billing_address = customer.addresses.find(
      address => address.id === parseInt(customer.default_billing)
    ) ?? {}

    customer.shipping_address = customer.addresses.find(
      address => address.id === parseInt(customer.default_shipping)
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

    return this.mapAssociatedDataFields(mappedDatafields, customer)
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

      const commerceCustomer = await this.commerceApi.getCustomer(customerData.id)
      const customer = Object.assign(commerceCustomer, customerData)

      const contact = {
        matchIdentifier: 'email',
        identifiers: {
          email: customerData.email
        },
        dataFields: await this.mapContactDataFields(dataFieldMapping, customer),
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
