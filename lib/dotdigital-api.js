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
      if (!response.ok) {
        this.logger.info(response)
        throw new Error(`HTTP error! status: ${response.status} Body ${options.body}`, response)
      }
      return await response.json()
    } catch (error) {
      this.logger.error(`Error making ${method} request:`, error)
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
     * @param {Object} data - The data to update the contact with.
     * @param {string} [mergeOption="overwrite"] - The merge option for the update (default is "overwrite").
     * @returns {Promise<Object>} A promise that resolves to the response of the update operation.
     */
    async patchContactByEmail(email, data, mergeOption = "overwrite") {
        return await this.patch(
            `/contacts/v3/email/${email}?merge-option=${mergeOption}`,
            data,
            {'merge-option': mergeOption},
        );
    }

  /**
     * Updates product data.
     * @param {number} id - The id of the product to update.
     * @param {string} collection - The name of the catalog collection.
     * @param {object} data - The data to update the product with.
     * @returns {Promise<object>} A promise that resolves to the response of the update operation.
     */
  async postProductById (id, collection, data) {
    return await this.post(`/v2/contacts/transactional-data/${collection}/${id}`, data)
  }
}

module.exports = { DotdigitalApi }