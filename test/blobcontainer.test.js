// Copyright (c) Henk Jan van Wijk. All rights reserved.
// Licensed under the MIT License.

const { BlobContainer } = require('../blobcontainer')

require('dotenv').config()

const config = {
  storageAccountName: process.env.STORAGE_ACCOUNT_NAME,
  storageAccountKey: process.env.STORAGE_ACCOUNT_KEY
}

describe('Create a blob container', () => {
  const containerName = `testcontainer${new Date().getTime()}`

  afterAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.deleteContainer({ containerName: containerName })
    } catch (error) {
      console.error(error)
    }
  })

  it('should create a new container', async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const resp = await container.createContainer({ containerName: containerName })
      expect.assertions(1)
      expect(resp).toBeDefined()
    } catch (error) {
      console.error(error)
    }
  })

  it('should add a blob', async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const resp = await container.createBlob({
        containerName: containerName,
        blobName: 'testblob.csv',
        content: 'date;description\n' +
                 '2020-05-01 00:00:00Z;Line 1\n'
      })
      expect.assertions(1)
      expect(resp).toBeDefined()
    } catch (error) {
      console.error(error)
    }
  })
})

describe('List blobs', () => {
  const containerName = `testcontainer${new Date().getTime()}`

  beforeAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.createContainer({ containerName: containerName })
      await container.createBlob({
        containerName: containerName,
        blobName: 'testblob1.csv',
        content: 'date;description\n' +
                 '2020-05-01 00:00:00Z;Line 1\n'
      })
    } catch (error) {
      console.error(error.message)
    }
  })

  afterAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.deleteContainer({ containerName: containerName })
    } catch (error) {
      console.error(error)
    }
  })

  it('should list all blobs in a container', async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const listOfBlobs = await container.listBlobs({ containerName: containerName })
      expect.assertions(1)
      expect(listOfBlobs.length).toEqual(1)
    } catch (error) {
      console.error(error)
    }
  })
})

describe('Get contents of blob', () => {
  const containerName = `testcontainer${new Date().getTime()}`

  beforeAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.createContainer({ containerName: containerName })
      await container.createBlob({
        containerName: containerName,
        blobName: 'testblob1.csv',
        content: 'date;description\n' +
                 '2020-05-01 00:00:00Z;Line 1\n'
      })
    } catch (error) {
      console.error(error.message)
    }
  })

  afterAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.deleteContainer({ containerName: containerName })
    } catch (error) {
      console.error(error)
    }
  })

  it('should get the content of a blob', async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const resp = await container.getBlobContent({ containerName: containerName, blobName: 'testblob1.csv' })
      expect.assertions(2)
      expect(resp).toBeDefined()
      expect(resp).toEqual(expect.stringContaining('date;description'))
    } catch (error) {
      console.error(error)
    }
  })
})

describe('Delete a single blob', () => {
  const containerName = `testcontainer${new Date().getTime()}`

  beforeAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const resp = await container.createContainer({ containerName: containerName })
      console.log(resp)
      const resp2 = await container.createBlob({
        containerName: containerName,
        blobName: 'testblob1.csv',
        content: 'date;description\n' +
                 '2020-05-01 00:00:00Z;Line 1\n'
      })
      console.log(resp2)
      const resp3 = await container.createBlob({
        containerName: containerName,
        blobName: 'testblob2.csv',
        content: 'date;description\n' +
                 '2020-05-02 00:00:00Z;Line 1\n'
      })
      console.log(resp3)
    } catch (error) {
      console.error(error)
    }
  })

  afterAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.deleteContainer({ containerName: containerName })
    } catch (error) {
      console.error(error)
    }
  })

  it('should add a container, 2 blobs and delete 1', async () => {
    try {
      expect.assertions(3)
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      let listOfBlobs = await container.listBlobs({ containerName: containerName })
      expect(listOfBlobs.length).toEqual(2)
      const resp = await container.deleteBlob({ containerName: containerName, blobName: 'testblob2.csv' })
      expect(resp).toBeTruthy()
      listOfBlobs = await container.listBlobs({ containerName: containerName })
      expect(listOfBlobs.length).toEqual(1)
    } catch (error) {
      console.error(error.message)
    }
  })
})

describe('Generate SAS token', () => {
  const containerName = `testcontainer${new Date().getTime()}`

  beforeAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.createContainer({ containerName: containerName })
      await container.createBlob({
        containerName: containerName,
        blobName: 'testblob1.csv',
        content: 'date;description\n' +
                 '2020-05-01 00:00:00Z;Line 1\n'
      })
      await container.createBlob({
        containerName: containerName,
        blobName: 'testblob2.csv',
        content: 'date;description\n' +
                 '2020-05-02 00:00:00Z;Line 1\n'
      })
    } catch (error) {
      console.error(error.message)
    }
  })

  afterAll(async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await container.deleteContainer({ containerName: containerName })
    } catch (error) {
      console.error(error)
    }
  })

  it('should generate a valid SAS token for a blob', async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const sastoken = container.generateSasToken({
        containerName: containerName,
        blobName: 'testblob1.csv',
        expireTime: 10
      })
      expect.assertions(4)
      expect(sastoken).toBeDefined()
      const readContainer = new BlobContainer({
        accountName: config.storageAccountName,
        sasToken: sastoken
      })
      const resp = await readContainer.getBlobContent({ containerName: containerName, blobName: 'testblob1.csv' })
      expect(resp).toBeDefined()
      expect(resp).toEqual(expect.stringContaining('date;description'))
      await readContainer.getBlobContent({ containerName: containerName, blobName: 'testblob2.csv' })
    } catch (error) {
      expect(error.code).toEqual(403) // Forbidden
    }
  })

  it('should generate a valid SAS token for a blob container', async () => {
    try {
      const container = new BlobContainer({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const sastoken = container.generateSasToken({
        containerName: containerName,
        expireTime: 10
      })
      expect.assertions(3)
      expect(sastoken).toBeDefined()
      const readContainer = new BlobContainer({
        accountName: config.storageAccountName,
        sasToken: sastoken
      })
      const resp = await readContainer.getBlobContent({ containerName: containerName, blobName: 'testblob2.csv' })
      expect(resp).toBeDefined()
      expect(resp).toEqual(expect.stringContaining('date;description'))
    } catch (error) {
      console.error(error)
    }
  })
})
