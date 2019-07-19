'use strict';

/*
NOTE: this plugin is used to add all the differnet provider related plugins at once.
This way only one plugin needs to be added to the service in order to get access to the
whole provider implementation.
*/

const FirebaseProvider = require('./provider/firebaseProvider');
const FirebaseDeploy = require('./deploy/firebaseDeploy');

class FirebaseIndex {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    if(this.serverless.service.provider.name === 'firebase') {
        this.serverless.pluginManager.addPlugin(FirebaseProvider);
        this.serverless.pluginManager.addPlugin(FirebaseDeploy);
    }
  }
}

module.exports = FirebaseIndex;
