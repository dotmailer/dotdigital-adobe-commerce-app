const { errorResponse, checkMissingRequestInputs } = require('../../../utils')
const { mix, mixable: { hasDotdigitalApi, hasCommerceApi, hasLogger } } = require('../../../mixable')

class ProductConsumer extends mix(class {}, [hasDotdigitalApi, hasCommerceApi, hasLogger]) {
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
      const storeId = product.store_ids ? product.store_ids[0] : params.data._metadata.storeId
      const requiredParams = ['entity_id', 'name', 'sku', 'stock_data', 'price', 'status', 'type_id', 'url_key', 'image', 'created_at']
      const errorMessage = checkMissingRequestInputs(product, requiredParams)
      if (errorMessage) {
        return errorResponse(400, errorMessage + JSON.stringify(product), this.logger)
      }

      const storeLinkUrl = params.DOTDIGITAL_CATALOG_BASE_LINK_URL || await this.commerceApi.getStoreUrl(storeId, 'link')
      const storeMediaUrl = params.DOTDIGITAL_CATALOG_BASE_MEDIA_URL || await this.commerceApi.getStoreUrl(storeId, 'media')

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
        url: `${storeLinkUrl}${product.url_key}/${product.sku}`,
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
