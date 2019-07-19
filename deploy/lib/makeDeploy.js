'use strict';

const path = require('path');
const firebaseDeploy = require('firebase-tools/lib/deploy');
const firebaseConfig = require('firebase-tools/lib/config');
const firebaseApi = require('firebase-tools/lib/api');
const firebaseAuth = require('firebase-tools/lib/auth');
const BbPromise = require('bluebird');
const transports = require('winston/lib/winston/transports');
var logger = require("firebase-tools/lib/logger");

module.exports = {
    token: '',
    makeDeploy() {
        return BbPromise.bind(this)
            .then(this.auth)
            .then(this.deploy);
    },
    auth() {
        var promises = [];
        this.serverless.cli.log('Firebase authentication.');
        promises.push(
            firebaseAuth
            .getAccessToken(this.serverless.service.provider.accessToken)
            .then(response => {
                this.token = response.access_token;
            })
        );
        return BbPromise.all(promises);
    },
    async deploy() {
        this.serverless.cli.log('Deploy Firebase functions...');
        const firebasePath = path.join('.serverless', 'firebase', 'functions');
        const allFunctions = this.readyFunctionsForDeploy;
        firebaseApi.setAccessToken(this.token);
        logger.add(transports.Console);
        for (const functionName of allFunctions) {
            this.serverless.cli.log('Deploy function: ' + functionName);
            var functionPathRelative = path.join(firebasePath, functionName);
            await firebaseDeploy(['functions'], {
                project: this.serverless.service.provider.project,
                nonInteractive: true,
                only: 'functions:' + functionName,
                config: new firebaseConfig({ functions: { source: functionPathRelative } }, {})
            })
        }

        return BbPromise.resolve();
    },
};
