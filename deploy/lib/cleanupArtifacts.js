'use strict';

const path = require('path');
const rimraf = require('rimraf');
const BbPromise = require('bluebird');

module.exports = {
  cleanupArtifacts() {
    this.serverless.cli.log('Removing old Firebase structure...');
    var artifactsPath = path.join(this.serverless.config.servicePath, '.serverless', 'firebase');
    rimraf.sync(artifactsPath);
    return BbPromise.resolve();
  },
};
