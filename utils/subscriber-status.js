const STATUS_MAP = {
  1: 'Subscribed',
  2: 'Not Active',
  3: 'Unsubscribed',
  4: 'Unconfirmed'
}

/**
 * Get subscriber status string
 *
 * @param {number} statusCode the status code
 * @returns {string} returns the status string
 */
function getSubscriberStatusString (statusCode) {
  if (Object.prototype.hasOwnProperty.call(STATUS_MAP, statusCode)) {
    return STATUS_MAP[statusCode]
  } else {
    return ''
  }
}

module.exports = {
  getSubscriberStatusString
}
