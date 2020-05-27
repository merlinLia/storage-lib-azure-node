// Copyright (c) Henk Jan van Wijk. All rights reserved.
// Licensed under the MIT License.

const logger = require('./logger')
const { StorageError } = require('./util')
const { QueueServiceClient, StorageSharedKeyCredential } = require('@azure/storage-queue')

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
   * @returns {array} - list of queues
   * @memberof StorageQueue
   */
  async list () {
    try {
      const queues = []
      const iter = await this.client.listQueues()
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
   * @returns {sendMessageResponse}
   * @memberof StorageQueue
   */
  async sendMessage ({ queueName, message }) {
    try {
      const queueClient = this.client.getQueueClient(queueName)
      const response = await queueClient.sendMessage(message)
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
}

module.exports = {
  StorageQueue
}
