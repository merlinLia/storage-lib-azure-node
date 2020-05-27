// Copyright (c) Henk Jan van Wijk. All rights reserved.
// Licensed under the MIT License.

const logger = require('./logger')
const { StorageError } = require('./util')
const { QueueServiceClient, StorageSharedKeyCredential, generateQueueSASQueryParameters, QueueSASPermissions } = require('@azure/storage-queue')

/**
 * Utility class for working with queues in Azure storage
 *
 * @class StorageQueue
 */
class StorageQueue {
  /**
     * Creates an instance of StorageQueue.
     * Use either shared key credentials: accountName + accountKey or SAS (accountName + sasToken)
     * as authentication method.
     * @param {object} params - Inputparameters
     * @param {string} params.accountName - Storage account name
     * @param {string} [params.accountKey] - Storage account key
     * @param {string} [params.sasToken] - Shared access signatures (SAS) token
     * @memberof BlobContainer
     */
  constructor ({ accountName, accountKey = null, sasToken = null }) {
    this.accountName = accountName
    this.accountKey = accountKey
    this.sasToken = sasToken
    this.logger = logger
    try {
      if (this.accountName && this.accountKey) {
        this.sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey)
        this.client = new QueueServiceClient(`https://${this.accountName}.queue.core.windows.net`,
          this.sharedKeyCredential
        )
      } else if (this.accountName && this.sasToken) {
        this.client = new QueueServiceClient(`https://${this.accountName}.queue.core.windows.net?${this.sasToken}`)
      } else {
        throw new StorageError(401, 'Missing authentication')
      }
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Create a new queue
   *
   * @param {object} params - Inputparameters
   * @param {string} params.queueName - Name of the queue
   * @returns When succesfull: requestId
   * @memberof StorageQueue
   */
  async create ({ queueName }) {
    try {
      const queueClient = this.client.getQueueClient(queueName)
      const response = await queueClient.create()
      logger.info(`Create queue ${queueName} successfully`, response.requestId)
      return response.requestId
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * List all queues in storage account
   *
   * @param {object} params - Inputparameters
   * @param {string} [params.prefix] - Optional filtering of the list to only show queues which start with the given prefix
   * @returns {array} - list of queues
   * @memberof StorageQueue
   */
  async list ({ prefix = null }) {
    try {
      const queues = []
      const options = {}
      if (prefix) {
        options.prefix = prefix
      }
      const iter = await this.client.listQueues(options)
      for await (const queue of iter) {
        queues.push(queue.name)
      }
      return queues
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Delete a queue
   *
   * @param {object} params - Inputparameters
   * @param {string} params.queueName - Name of the queue
   * @returns When succesfull: requestId
   * @memberof StorageQueue
   */
  async delete ({ queueName }) {
    try {
      const queueClient = this.client.getQueueClient(queueName)
      const response = await queueClient.delete()
      logger.info(`Delete queue ${queueName} successfully`, response.requestId)
      return response.requestId
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * @typedef {object} sendMessageResponse
   * @property {string} messageId - The assigned message id
   * @property {string} requestId - The assigned request id
   */
  /**
   * Send a message to a queue
   *
   * @param {object} params - Inputparameters
   * @param {string} params.queueName - Name of the storage queue
   * @param {string} params.message - The message to send
   *                                  The message content is up to 64KB in size, and must be in a format that can be included in an XML request with UTF-8 encoding.
   *                                  To include markup in the message, the contents of the message must either be XML-escaped or Base64-encode.
   * @param {number} [params.timeToLive] - (optional) Specifies the time-to-live interval for the message, in seconds
   * @param {number} [params.visibilityTimeout] - (optional) Specifies the visibility timeout value, in seconds, relative to server time. The
   *                                              default value is 30 seconds. A specified value must be larger than or equal to 1 second, and
   *                                              cannot be larger than 7 days.
   * @returns {sendMessageResponse}
   * @memberof StorageQueue
   */
  async sendMessage ({ queueName, message, timeToLive = null, visibilityTimeout = null }) {
    try {
      const queueClient = this.client.getQueueClient(queueName)
      const options = {}
      if (timeToLive) options.messageTimeToLive = timeToLive
      if (visibilityTimeout) options.visibilityTimeout = visibilityTimeout
      const response = await queueClient.sendMessage(message, options)
      return {
        messageId: response.messageId,
        requestId: response.requestId
      }
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Peek messages on a storage queue
   *
   * @param {object} params - Inputparameters
   * @param {string} params.queueName - Name of the storage queue
   * @returns {array} - Return an array of messages
   * @memberof StorageQueue
   */
  async peekMessages ({ queueName }) {
    try {
      const queueClient = this.client.getQueueClient(queueName)
      const response = await queueClient.peekMessages()
      return response
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * @typedef {Object} sasTokenResponseObject
   * @property {string} token - The generated SAS token
   *    A SAS token for a queue looks like:
   *    ```
   *    sp=r&st=2020-04-01T17:43:39Z&se=2020-05-01T01:43:39Z&sv=2019-02-02&sr=q&sig=FTpuyqN%2F34ba3rXXHePEMlxcSK4aqpLql3Jf4hvCF0I%3D
   *    ```
   *    where
   *    * `sp` are the permissions granted by the SAS include Read (r) and Write (w).
   *    * `st` is the startdate in UTC time.
   *    * `se` is the enddate (expiry time) in UTC time.
   *    * `sv` is the storage services version.
   *    * `sr` is the resource type (q = queue).
   *    * `spr` when set to `https` it means only allow https access.
   *    * `sip` when set: the range of IP addresses from which a request will be accepted.
   *    * `sig` is the signature. Used to authorize access to the queue.
   *      The signature is an HMAC computed over a string-to-sign and key using the SHA256 algorithm, and then encoded using Base64 encoding.
   * @property {string} uri - The full URI to the specified queue inclusing SAS token
   */
  /**
   * Generate SAS Token (access token) for access on a queue
   *
   * @param {object} params - Inputparameters
   * @param {string} params.queueName - Name of the queue
   * @param {string} [params.permissions] - Which operations are allowed by the the user of the SAS token (default = null means Read Only)
   * @param {number} [params.expireTime] - How long is the SAS token valid after now (default = 60 minutes after now)
   * @param {number} [params.clockSkewMarginMinutes] - Margin in minutes to avoid clock skew (default = 5 minutes).
   *                                                   Start time of token will be this number of minutes before now().
   * @returns {sasTokenResponseObject} - The generated SAS token
   */
  generateSasToken ({ queueName, permissions = null, expireTime = 60, clockSkewMarginMinutes = 5 }) {
    // Create a SAS token that expires in the number of minutes in expireTime
    // Set start time to five minutes ago to avoid clock skew.
    const startDate = new Date()
    const expiryDate = new Date(startDate)
    startDate.setMinutes(startDate.getMinutes() - clockSkewMarginMinutes)
    expiryDate.setMinutes(expiryDate.getMinutes() + expireTime)

    permissions = permissions || 'r'
    let sasToken = null
    sasToken = generateQueueSASQueryParameters({
      containerName: queueName,
      permissions: QueueSASPermissions.parse(permissions),
      startsOn: startDate,
      expiresOn: expiryDate
    },
    this.sharedKeyCredential
    ).toString()

    return sasToken
  }
}

module.exports = {
  StorageQueue
}
