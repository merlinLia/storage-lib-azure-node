// Copyright (c) Henk Jan van Wijk. All rights reserved.
// Licensed under the MIT License.

const logger = require('./logger')
const { StorageError, streamToString } = require('./util')
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, ContainerSASPermissions } = require('@azure/storage-blob')

/**
 * Utility class for working with Blob container in Azure storage
 *
 * @class BlobContainer
 */
class BlobContainer {
  /**
   * Creates an instance of BlobContainer.
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
        this.client = new BlobServiceClient(`https://${this.accountName}.blob.core.windows.net`,
          this.sharedKeyCredential
        )
      } else if (this.accountName && this.sasToken) {
        this.client = new BlobServiceClient(`https://${this.accountName}.blob.core.windows.net?${this.sasToken}`)
      } else {
        throw new StorageError(401, 'Missing authentication')
      }
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Create a new blob container
   *
   * @param {object} params - Inputparameters
   * @param {string} params.containerName - Name of the container
   * @returns When succesfull: requestId
   * @memberof BlobContainer
   */
  async createContainer ({ containerName }) {
    try {
      const containerClient = this.client.getContainerClient(containerName)
      const createContainerResponse = await containerClient.create()
      logger.info(`Create container ${containerName} successfully`, createContainerResponse.requestId)
      return createContainerResponse.requestId
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * List all blob containers in storage account
   *
   * @returns {array} - list of container names
   * @memberof BlobContainer
   */
  async listContainers () {
    try {
      const containers = []
      const iter = await this.client.listContainers()
      for await (const container of iter) {
        containers.push(container.name)
      }
      return containers
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Create a new blob in a blob container
   *
   * @param {object} params - Inputparameters
   * @param {string} params.containerName - Name of the container
   * @param {string} params.blobName - Name of the blob to create
   * @param {any} params.content - Content of the blob
   * @returns When succesfull: requestId
   * @memberof BlobContainer
   */
  async createBlob ({ containerName, blobName, content }) {
    try {
      const containerClient = this.client.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      const uploadBlobResponse = await blockBlobClient.upload(content, Buffer.byteLength(content))
      logger.info(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId)
      return uploadBlobResponse.requestId
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * List all blobs in a blob container
   *
   * @param {object} params - Inputparameters
   * @param {string} params.containerName - Name of the container
   * @returns {array} - list of blobs
   * @memberof BlobContainer
   */
  async listBlobs ({ containerName }) {
    const bloblist = []
    try {
      const containerClient = this.client.getContainerClient(containerName)
      for await (const blob of containerClient.listBlobsFlat()) {
        bloblist.push(blob)
      }
      return bloblist
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Get the content of a blob
   *
   * @param {object} params - Inputparameters
   * @param {string} params.containerName - Name of the container
   * @param {string} params.blobName - Name of the blob to create
   * @returns {string} - content of blob
   * @memberof BlobContainer
   */
  async getBlobContent ({ containerName, blobName }) {
    // Get blob content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
    try {
      const containerClient = this.client.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      const downloadBlockBlobResponse = await blockBlobClient.download(0)
      const content = await streamToString(downloadBlockBlobResponse.readableStreamBody)
      return content
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Delete a blob container with contents
   *
   * @param {object} params - Inputparameters
   * @param {string} params.containerName - Name of the container
   * @returns {boolean} - Return True if succesfull, otherwise an error will be raised
   * @memberof BlobContainer
   */
  async deleteContainer ({ containerName }) {
    try {
      const containerClient = this.client.getContainerClient(containerName)
      await containerClient.delete()
      return true
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * Delete a blob with all its snapshots
   *
   * @param {object} params - Inputparameters
   * @param {string} params.containerName - Name of the container
   * @param {string} params.blobName - Name of the blob to create
   * @returns {boolean} - Return True if succesfull, otherwise an error will be raised
   * @memberof BlobContainer
   */
  async deleteBlob ({ containerName, blobName }) {
    try {
      const containerClient = this.client.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      await blockBlobClient.delete()
      return true
    } catch (error) {
      throw new StorageError(error.statusCode || 500, error.message)
    }
  }

  /**
   * @typedef {Object} sasTokenResponseObject
   * @property {string} token - The generated SAS token
   *    A SAS token for a blob looks like:
   *    ```
   *    sp=r&st=2020-04-01T17:43:39Z&se=2020-05-01T01:43:39Z&sv=2019-02-02&sr=b&sig=FTpuyqN%2F34ba3rXXHePEMlxcSK4aqpLql3Jf4hvCF0I%3D
   *    ```
   *    where
   *    * `sp` are the permissions granted by the SAS include Read (r) and Write (w).
   *    * `st` is the startdate in UTC time.
   *    * `se` is the enddate (expiry time) in UTC time.
   *    * `sv` is the storage services version.
   *    * `sr` is the resource type (b = blob).
   *    * `spr` when set to `https` it means only allow https access.
   *    * `sip` when set: the range of IP addresses from which a request will be accepted.
   *    * `sig` is the signature. Used to authorize access to the blob.
   *      The signature is an HMAC computed over a string-to-sign and key using the SHA256 algorithm, and then encoded using Base64 encoding.
   * @property {string} uri - The full URI to the specified blobcontainer (and blob) inclusing SAS token
   */
  /**
   * Generate SAS Token (access token) for read access on blob container
   *
   * @param {object} params - Inputparameters
   * @param {string} params.containerName - Name of the Storage account Blob container
   * @param {string} [params.blobName] - Name of the specific blob to generate the token for
   * @param {string} [params.permissions] - Which operations are allowed by the the user of the SAS token (default = null means Read Only)
   * @param {number} [params.expireTime] - How long is the SAS token valid after now (default = 60 minutes after now)
   * @param {number} [params.clockSkewMarginMinutes] - Margin in minutes to avoid clock skew (default = 5 minutes).
   *                                                   Start time of token will be this number of minutes before now().
   * @returns {sasTokenResponseObject} - The generated SAS token
   */
  generateSasToken ({ containerName, blobName, permissions = null, expireTime = 60, clockSkewMarginMinutes = 5 }) {
    // Create a SAS token that expires in the number of minutes in expireTime
    // Set start time to five minutes ago to avoid clock skew.
    const startDate = new Date()
    const expiryDate = new Date(startDate)
    startDate.setMinutes(startDate.getMinutes() - clockSkewMarginMinutes)
    expiryDate.setMinutes(expiryDate.getMinutes() + expireTime)

    permissions = permissions || 'r'
    let sasToken = null
    if (blobName) {
      sasToken = generateBlobSASQueryParameters({
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse(permissions),
        startsOn: startDate,
        expiresOn: expiryDate
      },
      this.sharedKeyCredential
      ).toString()
    } else {
      sasToken = generateBlobSASQueryParameters({
        containerName,
        permissions: ContainerSASPermissions.parse(permissions),
        startsOn: startDate,
        expiresOn: expiryDate
      },
      this.sharedKeyCredential
      ).toString()
    }

    return sasToken
  }
}

module.exports = {
  BlobContainer
}
