'use strict';

const path = require('path');
const firebaseClient = require('firebase-tools');
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
        var cli = this.serverless.cli;
        cli.log('Deploy Firebase functions...');
        const firebasePath = path.join('.serverless', 'firebase', 'functions');
        const allFunctions = this.readyFunctionsForDeploy;
        firebaseApi.setAccessToken(this.token);
        logger.add(transports.Console);
        
        for (const functionName of allFunctions) {
            cli.log('Deploy function: ' + functionName);
            var functionPathRelative = path.join(firebasePath, functionName);

            await firebaseClient.deploy({
                project: this.serverless.service.provider.project,
                token: this.token,
                force: true,
                cwd: functionPathRelative,
                projectDir: path.resolve(functionPathRelative),
                only: 'functions:' + functionName,
            }).then(function () {
                cli.log('Function deployed.');
            }).catch(function (err) {
                console.log(err)
            });
        }

        return BbPromise.resolve();
    },
};
