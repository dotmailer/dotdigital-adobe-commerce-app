/**
 * Error class to handle Dotdigital API errors.
 */
class DotdigitalHttpError extends Error {
  constructor (httpResponse = {}, jsonResponse = {}) {
    const message = `HTTP ${httpResponse.status ?? 'unknown'}: ${httpResponse.statusText ?? 'No status text'} ` +
        `ErrorCode: ${jsonResponse.errorCode ?? 'error-unknown'} ` +
        `Description: ${jsonResponse.description ?? ''}`
    super(message)
    this.name = this.constructor.name
    this.errorCode = jsonResponse.errorCode ?? 'error-unknown'
    this.description = jsonResponse.description ?? ''
    this.status = httpResponse.status ?? 'unknown'
    this.statusText = httpResponse.statusText ?? 'No status text'
    this.url = httpResponse.url ?? 'No URL'

    // Maintains proper stack trace for where our error was thrown (non-standard)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DotdigitalHttpError)
    }
  }
}

/**
 * Client class to handle HTTP requests with Basic Authentication using MD5 encryption.
 */
class DotdigitalApi {
  /**
   * Creates an instance of Client.
   * @param {string} baseURL - The base URL for the API.
   * @param {string} username - The username for authentication.
   * @param {string} password - The password for authentication.
   * @param {object} [logger] - Optional custom logger.
   */
  constructor (baseURL, username, password, logger = console) {
    this.baseURL = baseURL
    this.username = username
    this.password = password
    this.logger = logger
  }

  /**
   * Makes an HTTP request.
   * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, PATCH).
   * @param {string} endpoint - The API endpoint.
   * @param {object} [params] - The query parameters.
   * @param {object} [body] - The request body.
   * @returns {Promise<object>} - The response data.
   * @throws Will throw an error if the HTTP request fails.
   */
  async request (method, endpoint, params = {}, body = null) {
    const url = new URL(`${this.baseURL}${endpoint}`)
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    const options = {
      method,
      headers: {
        Authorization: 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64'),
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)
      let jsonResponse = {}
      // v3 204 responses does not contain json response
      if (response.status === 204) {
        jsonResponse = { status: '204', message: 'Record replaced' }
      } else {
        jsonResponse = await response.json()
      }
      if (!response.ok) {
        throw new DotdigitalHttpError(response, jsonResponse)
      }

      return jsonResponse
    } catch (error) {
      if (error instanceof DotdigitalHttpError) {
        this.logger.error(error.name) // DotdigitalHttpError
        this.logger.error(error.errorCode)
        this.logger.error(error.description)
        this.logger.error(error.status)
        this.logger.error(error.statusText)
        this.logger.error(error.url)
      } else {
        this.logger.error(`Error making ${method} request:`, error)
      }
      throw error
    }
  }

  /**
   * Makes a GET request.
   * @param {string} endpoint - The API endpoint.
   * @param {object} [params] - The query parameters.
   * @returns {Promise<object>} - The response data.
   */
  get (endpoint, params = {}) {
    return this.request('GET', endpoint, params)
  }

  /**
   * Makes a POST request.
   * @param {string} endpoint - The API endpoint.
   * @param {object} body - The request body.
   * @param {object} [params] - The query parameters.
   * @returns {Promise<object>} - The response data.
   */
  post (endpoint, body, params = {}) {
    return this.request('POST', endpoint, params, body)
  }

  /**
   * Makes a PUT request.
   * @param {string} endpoint - The API endpoint.
   * @param {object} body - The request body.
   * @param {object} [params] - The query parameters.
   * @returns {Promise<object>} - The response data.
   */
  put (endpoint, body, params = {}) {
    return this.request('PUT', endpoint, params, body)
  }

  /**
   * Makes a DELETE request.
   * @param {string} endpoint - The API endpoint.
   * @param {object} [params] - The query parameters.
   * @returns {Promise<object>} - The response data.
   */
  delete (endpoint, params = {}) {
    return this.request('DELETE', endpoint, params)
  }

  /**
   * Makes a PATCH request.
   * @param {string} endpoint - The API endpoint.
   * @param {object} body - The request body.
   * @param {object} [params] - The query parameters.
   * @returns {Promise<object>} - The response data.
   */
  patch (endpoint, body, params = {}) {
    return this.request('PATCH', endpoint, params, body)
  }

  /**
   * Retrieves the data fields for contacts.
   * @returns {Promise<object>} A promise that resolves to the data fields.
   */
  async getContactDataFields () {
    return await this.get('/v2/data-fields')
  }

  /**
   * Updates a contact by email.
   * @param {string} email - The email of the contact to update.
   * @param {object} data - The data to update the contact with.
   * @param {string} [mergeOption] - The merge option for the update (default is "overwrite").
   * @returns {Promise<object>} A promise that resolves to the response of the update operation.
   */
  async patchContactByEmail (email, data, mergeOption = 'overwrite') {
    return await this.patch(
            `/contacts/v3/email/${email}`,
            data,
            { 'merge-option': mergeOption }
    )
  }

  /**
   * Updates product data.
   * @param {number} id - The id of the product to update.
   * @param {string} collection - The name of the catalog collection.
   * @param {object} data - The data to update the product with.
   * @returns {Promise<object>} A promise that resolves to the response of the update operation.
   */
  async putProductById (id, collection, data) {
    let response = {}
    try {
      response = await this.put(`/insightData/v3/account/${collection}/${id}`, data)
    } catch (e) {
      if (e.status === 404) {
        /* create the collection if it does not exist */
        const records = [{
          key: id,
          json: data
        }]

        response = await this.put('/insightData/v3/import', {
          collectionName: collection,
          collectionScope: 'account',
          collectionType: 'catalog',
          records
        })
      }
    }

    return response
  }

  /**
   * Updates order data.
   * @param {string} contactEmail - Contact identifier.
   * @param {object} orderData - The data to update the order with.
   * @returns {Promise<object>} A promise that resolves to the response of the update operation.
   */
  async putOrderById (contactEmail, orderData) {
    let response = {}
    try {
      response = await this.put(`/insightData/v3/contacts/email/${contactEmail}/Orders/${orderData.id}`, orderData)
    } catch (e) {
      if (e.status === 404) {
        /* create the collection if it does not exist */

        const records = [{
          contactIdentity: {
            identifier: 'email',
            value: contactEmail
          },
          key: orderData.id,
          json: orderData
        }]

        response = await this.put('/insightData/v3/import', {
          collectionName: 'Orders',
          collectionScope: 'contact',
          collectionType: 'orders',
          records
        })
      }
    }

    return response
  }
}

module.exports = { DotdigitalApi }
