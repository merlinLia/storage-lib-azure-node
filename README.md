# Azure Storage Support library

The Azure Storage Support Library contains classes and functions for working with Azure Storage and is a wrapper arround the [Azure Storage client library for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/storage).
See more information the [Azure documentation](https://docs.microsoft.com/en-us/azure/javascript/?view=azure-node-latest)

# Setup for Developers
## Requirements
- Visual Studio Code
- NodeJS 12.x

## Environment setup
- Run `npm install` to install the dependencies. Or `npm update` to update the existing npm module versions to the latest patch version.

# Unittests
Run `npm test` to run the unittests locally. It will also create the code coverage in the folder `coverage`. Open de index.html file afterwards to see the details. 

# Version History

| Version | Date       | Notes |
|---------|------------|-------|
| 0.1.1   | 2020-05-22 | Add generate SAS token for container and blob |
| 0.1.0   | 2020-05-19 | Initial implementation |
