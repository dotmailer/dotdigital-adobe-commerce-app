const { errorResponse, checkMissingRequestInputs } = require('../../../utils')
const { mix, mixable: { hasDotdigitalClient, hasCommerceClient, hasLogger } } = require('../../../mixable')

class ProductConsumer extends mix(class {}, [hasDotdigitalClient, hasCommerceClient, hasLogger]) {
  /**
   * Static method to invoke the main function.
   * @param {object} params - The parameters for the handler.
   * @returns {Promise<object>} The result of the main function.
   */
  static async invoke (params) {
    const handler = new ProductConsumer(params)
    return handler.main(params)
  }

  /**
   * This is the consumer of the events coming from Adobe Commerce related to the product entity.
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
      const product = params.data.value
      const requiredParams = ['entity_id', 'name', 'sku', 'stock_data', 'price', 'status', 'type_id', 'url_key', 'image', 'created_at', 'store_ids']
      const errorMessage = checkMissingRequestInputs(product, requiredParams)
      if (errorMessage) {
        return errorResponse(400, errorMessage + JSON.stringify(product), this.logger)
      }

      const requiredEnvParams = ['COMMERCE_BASE_URL', 'COMMERCE_CONSUMER_KEY', 'COMMERCE_CONSUMER_SECRET', 'COMMERCE_ACCESS_TOKEN', 'COMMERCE_ACCESS_TOKEN_SECRET', 'DOTDIGITAL_API_URL', 'DOTDIGITAL_API_USER', 'DOTDIGITAL_API_PASSWORD', 'DOTDIGITAL_CATALOG_COLLECTION_NAME']
      const envErrorMessage = checkMissingRequestInputs(params, requiredEnvParams)
      if (envErrorMessage) {
        return errorResponse(400, envErrorMessage + JSON.stringify(params), this.logger)
      }

      const storeLinkUrl = await this.commerceApi.getStoreUrl(product.store_ids[0], 'link')
      const storeMediaUrl = await this.commerceApi.getStoreUrl(product.store_ids[0], 'media')

      // transform product payload
      const productData = {
        id: product.entity_id,
        name: product.name,
        type: product.type_id.charAt(0).toUpperCase() + product.type_id.slice(1),
        status: (product.status === '1') ? 'Enabled' : 'Disabled',
        stock: product.stock_data.qty,
        sku: product.sku,
        created_date: new Date(product.created_at).toISOString(),
        price: product.price,
        url: `${storeLinkUrl}${product.url_key}.html`,
        imagePath: `${storeMediaUrl}catalog/product${product.image}`
      }

      if (product.parent_id) {
        productData.parent_id = product.parent_id
        productData.type = 'Variant'
      }

      const response = await this.dotdigitalApi.putProductById(product.entity_id, params.DOTDIGITAL_CATALOG_COLLECTION_NAME, productData)

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
exports.main = (params) => ProductConsumer.invoke(params)
