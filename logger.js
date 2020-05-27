// Copyright (c) Henk Jan van Wijk. All rights reserved.
// Licensed under the MIT License.
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

/** Set the output format when using the logger
  * Logging is sent to the console. In Azure functions this will be sent to Application Insights
  * when this the function is connected to an Application Insights instance.
  * Use of this logger provides a single interface to logging.
  *
  */
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'storage-lib' },
  format: combine(
    label({ label: 'StorageUtil' }),
    timestamp(),
    myFormat
  ),
  transports: [new transports.Console()]
})

module.exports = exports = logger
