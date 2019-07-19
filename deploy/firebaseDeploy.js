'use strict';

const BbPromise = require('bluebird');

const createDeployment = require('./lib/createDeployment');
const makeDeploy = require('./lib/makeDeploy');

class FirebaseDeploy {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = this.serverless.getProvider('Firebase');
        this.readyFunctionsForDeploy = [];
        Object.assign(
            this,
            createDeployment,
            makeDeploy
        );

        this.hooks = {
            'before:deploy:deploy': () => BbPromise.bind(this)
                .then(this.cleanupArtifacts)
            ,

            'deploy:deploy': () => BbPromise.bind(this)
                .then(this.createDeployment)
                .then(this.makeDeploy)
            ,
            'before:deploy:function:deploy': () => BbPromise.bind(this)
                .then(this.cleanupArtifacts)
            ,

            'deploy:function:deploy': () => BbPromise.bind(this)
                .then(this.createDeployment)
                .then(this.makeDeploy)
            ,
        };
    }
}

module.exports = FirebaseDeploy;
