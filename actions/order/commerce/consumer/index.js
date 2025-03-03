const { Core } = require('@adobe/aio-sdk')
const { errorResponse, checkMissingRequestInputs } = require('../../../utils')
const { DotdigitalApi } = require('../../../../lib')

class OrderConsumer {
  /**
   * Create a OrderConsumer.
   * @param {object} params - The parameters for the handler.
   */
  constructor (params) {
    this.logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
    this.dotdigitalApi = new DotdigitalApi(
      params.DOTDIGITAL_API_URL,
      params.DOTDIGITAL_API_USER,
      params.DOTDIGITAL_API_PASSWORD,
      this.logger
    )
  }

  /**
   * @param {Array} items Order line items
   * @returns {Promise<object>} returns transformed order line items
   */
  transformOrderLineItems (items) {
    const products = []

    items.forEach(item => {
      if (item.product_type === 'configurable') {
        return
      }
      const product = {
        product_id: item.product_id,
        parent_id: '',
        name: item.name,
        price: parseFloat(item.price),
        sku: item.sku,
        qty: item.qty_ordered
      }

      if (item.product_type === 'simple' && item.parent_item_id) {
        const parentItem = items.find(parent => parent.item_id === item.parent_item_id)
        if (parentItem && parentItem.product_type === 'bundle') {
          product.parent_id = parentItem.product_id
          product.parent_name = parentItem.name
          const parentProductIndex = products.findIndex(p => p.product_id === parentItem.product_id)
          if (parentProductIndex !== -1) {
            if (!products[parentProductIndex].sub_items) {
              products[parentProductIndex].sub_items = []
            }
            products[parentProductIndex].sub_items.push(product)

            // remove sku from parent bundle line so it can be linked in dd
            products[parentProductIndex].sku = products[parentProductIndex].sku.replace('-' + product.sku, '')
          }
          return
        } else if (parentItem) {
          product.parent_id = parentItem.product_id
          product.parent_name = parentItem.name
          product.price = parseFloat(parentItem.price)
        }
      }
      products.push(product)
    })

    return products
  }

  /**
   * @param {object} orderData order data to be sent
   * @param {object} addresses order addresses to add
   * @returns {Promise<object>} returns updated order data.
   */
  addOrderAddresses (orderData, addresses) {
    addresses.forEach(address => {
      if (address.address_type === 'shipping') {
        orderData.deliveryAddress = {
          delivery_address_1: address.street,
          delivery_address_2: '',
          delivery_city: address.city,
          delivery_region: address.region,
          delivery_country: address.country_id,
          delivery_postcode: address.postcode
        }
      }
      if (address.address_type === 'billing') {
        orderData.billingAddress = {
          billing_address_1: address.street,
          billing_address_2: '',
          billing_city: address.city,
          billing_region: address.region,
          billing_country: address.country_id,
          billing_postcode: address.postcode
        }
      }
    })

    return orderData
  }

  /**
   * Static method to invoke the main function.
   * @param {object} params - The parameters for the handler.
   * @returns {Promise<object>} The result of the main function.
   */
  static async invoke (params) {
    const handler = new OrderConsumer(params)
    return handler.main(params)
  }

  /**
   * This is the consumer of the events coming from Adobe Commerce related to the order entity.
   *
   * @returns {object} returns response object with status code, request data received and response of the invoked action
   * @param {object} params - includes the env params, type and the data of the event
   */

  async main (params) {
    const returnObject = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: ''
    }
    try {
      const order = params.data.value
      const requiredParams = ['entity_id', 'grand_total', 'order_currency_code', 'created_at', 'subtotal', 'items', 'customer_email', 'increment_id', 'quote_id', 'status', 'addresses', 'store_name', 'discount_amount', 'payment', 'shipping_description', 'shipping_amount']
      const errorMessage = checkMissingRequestInputs(order, requiredParams)
      if (errorMessage) {
        return errorResponse(400, errorMessage + JSON.stringify(order), this.logger)
      }

      const requiredEnvParams = ['COMMERCE_BASE_URL', 'COMMERCE_CONSUMER_KEY', 'COMMERCE_CONSUMER_SECRET', 'COMMERCE_ACCESS_TOKEN', 'COMMERCE_ACCESS_TOKEN_SECRET', 'DOTDIGITAL_API_URL', 'DOTDIGITAL_API_USER', 'DOTDIGITAL_API_PASSWORD']
      const envErrorMessage = checkMissingRequestInputs(params, requiredEnvParams)
      if (envErrorMessage) {
        return errorResponse(400, envErrorMessage + JSON.stringify(params), this.logger)
      }

      if (!order.items || !Array.isArray(order.items)) {
        return errorResponse(400, 'Order does not contain any items', this.logger)
      }

      /* create contact in dotdigital */
      const contactIdentifier = order.customer_email
      const matchIdentifier = 'email'
      const contactPayload = {
        matchIdentifier,
        identifiers: { email: contactIdentifier }
      }

      await this.dotdigitalApi.patchContactByEmail(contactIdentifier, contactPayload)

      const orderLineItems = this.transformOrderLineItems(order.items)
      // transform order payload
      let orderData = {
        id: order.increment_id,
        quoteId: order.quote_id,
        orderStatus: order.status,
        orderTotal: parseFloat(order.grand_total),
        currency: order.order_currency_code,
        purchaseDate: new Date(order.created_at).toISOString(),
        orderSubtotal: parseFloat(order.subtotal),
        products: orderLineItems,
        storeName: order.store_name.split('\n').pop(),
        discountAmount: parseFloat(order.discount_amount),
        payment: order.payment.additional_information.method_title,
        deliveryMethod: order.shipping_description,
        deliveryTotal: parseFloat(order.shipping_amount),
        couponCode: order.coupon_code ?? ''
      }
      orderData = this.addOrderAddresses(orderData, order.addresses)

      const response = await this.dotdigitalApi.putOrderById(order.customer_email, orderData)

      returnObject.statusCode = 200
      returnObject.body = Buffer.from(JSON.stringify(response)).toString()
    } catch (error) {
      this.logger.error(error)
      return errorResponse(error?.status ?? 500, error.message, this.logger)
    }

    return returnObject
  }
}
/**
 * Export the main function to be executed by Adobe I/O Runtime.
 * @param {object} params - The parameters for the handler.
 * @returns {Promise<object>} The result of the main function.
 */
exports.main = (params) => OrderConsumer.invoke(params)
