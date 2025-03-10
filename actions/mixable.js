const { Core } = require('@adobe/aio-sdk')
const { CommerceApi, DotdigitalApi } = require('../lib')

/**
 * Mixin to add Dotdigital client functionality.
 * @param {object} Base - The base class to extend.
 * @returns {object} The extended class with Dotdigital client functionality.
 */
const hasDotdigitalClient = (Base) => class extends Base {
  constructor (params) {
    super(params)
    this.dotdigitalApi = new DotdigitalApi(
      params.DOTDIGITAL_API_URL,
      params.DOTDIGITAL_API_USER,
      params.DOTDIGITAL_API_PASSWORD,
      this.logger
    )
  }
}

/**
 * Mixin to add Commerce client functionality.
 * @param {object} Base - The base class to extend.
 * @returns {object} The extended class with Commerce client functionality.
 */
const hasCommerceClient = (Base) => class extends Base {
  constructor (params) {
    super(params)
    this.commerceApi = new CommerceApi({
      url: params.COMMERCE_BASE_URL,
      consumerKey: params.COMMERCE_CONSUMER_KEY,
      consumerSecret: params.COMMERCE_CONSUMER_SECRET,
      accessToken: params.COMMERCE_ACCESS_TOKEN,
      accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET
    }, this.logger)
  }
}

/**
 * Mixin to add logging functionality.
 * @param {object} Base - The base class to extend.
 * @returns {object} The extended class with logging functionality.
 */
const hasLogger = (Base) => class extends Base {
  constructor (params) {
    super(params)
    this.logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  }
}

/**
 * Mixin to add data fields mapping functionality.
 * @param {object} Base - The base class to extend.
 * @returns {object} The extended class with data fields mapping functionality.
 */
const hasDataFields = (Base) => class extends Base {
  /**
   * Get allowed data fields from Dotdigital
   * @param {*} dataFieldKeys - List of datafield keys
   * @returns {*} - List of allowed datafield keys
   */
  async filterAllowedDataFields (dataFieldKeys) {
    const dotdigitalDataFields = await this.dotdigitalApi.getContactDataFields()
    return dotdigitalDataFields.filter(
      dataField => dataFieldKeys.includes(dataField.name)
    )
  }

  /**
   * Add a mapping key to each data field referencing the relevant data source.
   * @param {*} dataFields - Dotdigital datafields
   * @param {*} map - datafield map
   * @returns {*} - Mapped datafields
   */
  async associateDataFieldsMapping (dataFields, map) {
    return dataFields.reduce((acc, dataField) => {
      dataField.mapping = map[dataField.name]
      acc.push(dataField)
      return acc
    }, [])
  }

  /**
   * Map associated data fields, Set actual data keys on the 'data' entity.
   * @param {object} dataField - Datafields
   * @param {*} data - data to be mapped
   * @returns {*} - mapped datafields
   */
  async mapAssociatedDataFields (dataField, data) {
    return dataField.reduce((acc, dataField) => {
      if (!dataField?.mapping) {
        console.warn(`Data field [${dataField?.name}] mapping key is missing`)
        return acc
      }

      if (dataField.mapping.split('.').length > 1) {
        const [parent, child, index] = dataField.mapping.split('.')
        if (data[parent] && data[parent][child]) {
          if (index) {
            acc[dataField.name] = data[parent][child][index]
          } else {
            acc[dataField.name] = data[parent][child]
          }
        }
        return acc
      }
      if (data[dataField.mapping]) {
        acc[dataField.name] = data[dataField.mapping]
      }
      return acc
    }, {})
  }
}

/**
 * Apply mixins to a base class.
 * @param {object} Base - The base class to extend.
 * @param {Array} mixins - The mixins to apply.
 * @returns {object} The extended class with applied mixins.
 */
const mixin = (Base, mixins = []) => mixins.reduce((acc, mixin) => mixin(acc), Base)

module.exports = {
  mix: mixin,
  mixable: {
    hasDotdigitalClient,
    hasCommerceClient,
    hasDataFields,
    hasLogger
  }
}
