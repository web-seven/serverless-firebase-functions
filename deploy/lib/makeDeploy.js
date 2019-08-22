'use strict';

const path = require('path');
const firebaseClient = require('firebase-tools');
const firebaseApi = require('firebase-tools/lib/api');
const firebaseAuth = require('firebase-tools/lib/auth');
const BbPromise = require('bluebird');
const transports = require('winston/lib/winston/transports');
const merge = require("lodash.merge");
var logger = require("firebase-tools/lib/logger");

module.exports = {
    token: '',
    makeDeploy() {
        if (typeof this.options['dry-run'] !== undefined && this.options['dry-run']) {
            return BbPromise.resolve();
        }

        return BbPromise.bind(this)
            .then(this.auth)
            .then(this.deploy);
    },
    auth() {
        var promises = [];
        this.serverless.cli.log('Firebase authentication.');

        var refreshToken = '';

        if (this.serverless.service.provider['accessToken'] !== undefined) {
            refreshToken = this.serverless.service.provider.accessToken;
        } else if (this.serverless.service.provider['token'] !== undefined) {
            refreshToken = this.serverless.service.provider.accessToken;
        } else {
            throw 'Firebase token not found. Please generate it using "firebase login:ci" and setup it under "provider.token" serverless.yml value.'
        }

        promises.push(
            firebaseAuth
                .getAccessToken(refreshToken)
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

        var globalEnvVariables = {};
        if (typeof this.serverless.service.provider['environment'] === 'object') {
            globalEnvVariables = this.serverless.service.provider['environment'];
        }
        
        var functionsConfig = [];
        for (const functionName of allFunctions) {
            var functionObject = this.serverless.service.getFunction(functionName);
            var functionEnvVariables = globalEnvVariables;
            if (typeof functionObject['environment'] === 'object') {
                merge(functionEnvVariables, functionObject['environment']);
            }
            
            functionsConfig.push(`serverless.${functionName.toLowerCase()}="${new Buffer(JSON.stringify(functionEnvVariables)).toString("base64")}"`);
        }

        if(functionsConfig.length > 0) {
            await firebaseClient.functions.config.set(functionsConfig, {});
        }

        for (const functionName of allFunctions) {
            cli.log('Deploy function: ' + functionName);
            var functionPathRelative = path.join(firebasePath, functionName);

            await firebaseClient.deploy({
                project: this.serverless.service.provider.project,
                token: this.token,
                force: true,
                cwd: functionPathRelative,
                projectDir: path.resolve(functionPathRelative),
                only: 'functions:' + functionName
            }).then(function () {
                cli.log('Function deployed.');
            }).catch(function (err) {
                console.log(err)
            });

        }

        return BbPromise.resolve();
    },
};
