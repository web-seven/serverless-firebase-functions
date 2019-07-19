'use strict';

const constants = {
  providerName: 'firebase',
};

class FirebaseProvider {
  static getProviderName() {
    return constants.providerName;
  }

  constructor(serverless) {
    this.serverless = serverless;
    this.provider = this; 
    this.serverless.setProvider(constants.providerName, this);
  }
}

module.exports = FirebaseProvider;
