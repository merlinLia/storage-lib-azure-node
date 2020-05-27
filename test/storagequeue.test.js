// Copyright (c) Henk Jan van Wijk. All rights reserved.
// Licensed under the MIT License.

const { StorageQueue } = require('../storagequeue')

require('dotenv').config()

const config = {
  storageAccountName: process.env.STORAGE_ACCOUNT_NAME,
  storageAccountKey: process.env.STORAGE_ACCOUNT_KEY
}

describe('Create a storage queue', () => {
  const queueName = `test${new Date().getTime()}`

  afterAll(async () => {
    try {
      const queue = new StorageQueue({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await queue.delete({ queueName: queueName })
    } catch (error) {
      console.error(error)
    }
  })

  it('should create a new queue', async () => {
    try {
      const queue = new StorageQueue({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const resp = await queue.create({ queueName: queueName })
      expect.assertions(1)
      expect(resp).toBeDefined()
    } catch (error) {
      console.error(error)
    }
  })
})

describe('List queues', () => {
  const queueName = `test${new Date().getTime()}`

  beforeAll(async () => {
    try {
      const queue = new StorageQueue({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await queue.create({ queueName: queueName })
      await queue.create({
        queueName: queueName
      })
    } catch (error) {
      console.error(error.message)
    }
  })

  afterAll(async () => {
    try {
      const queue = new StorageQueue({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      await queue.delete({ queueName: queueName })
    } catch (error) {
      console.error(error)
    }
  })

  it('should list all test storage queues', async () => {
    try {
      const queue = new StorageQueue({
        accountName: config.storageAccountName,
        accountKey: config.storageAccountKey
      })
      const listOfQueues = await queue.list({ prefix: 'test' })
      expect.assertions(1)
      expect(listOfQueues.length).toEqual(1)
    } catch (error) {
      console.error(error)
    }
  })
})
