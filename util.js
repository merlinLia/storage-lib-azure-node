// Copyright (c) Henk Jan van Wijk. All rights reserved.
// Licensed under the MIT License.

class StorageError extends Error {
  constructor (code, message) {
    super(message)
    this.code = code
  }
}

// A helper method used to read a Node.js readable stream into string
async function streamToString (readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', (data) => {
      chunks.push(data.toString())
    })
    readableStream.on('end', () => {
      resolve(chunks.join(''))
    })
    readableStream.on('error', reject)
  })
}

module.exports = { StorageError, streamToString }
