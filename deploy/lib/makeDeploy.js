'use strict';

const path = require('path');
var client = require('firebase-tools');
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
    deploy() {
        this.serverless.cli.log('Deploy Firebase functions...');
        const firebasePath = path.join('.serverless', 'firebase', 'functions');
        const allFunctions = this.readyFunctionsForDeploy;
        firebaseApi.setAccessToken(this.token);
        logger.add(transports.Console);
        
        client.list().then(function (data) {
            console.log(data);
        }).catch(function (err) {
            // handle error
        });
        var promises = [];
        for (const functionName of allFunctions) {

            this.serverless.cli.log('Deploy function: ' + functionName);
            var functionPathRelative = path.join(firebasePath, functionName);

            // await firebaseDeploy(['functions'], {
            //     project: this.serverless.service.provider.project,
            //     nonInteractive: true,
            //     only: 'functions:' + functionName,
            //     config: new firebaseConfig({ functions: { source: functionPathRelative } }, {
            //         projectDir: path.resolve('.')
            //     })
            // })


            promises.push(client.deploy({
                project: this.serverless.service.provider.project,
                token: this.token,
                force: true,
                cwd: functionPathRelative,
                projectDir: functionPathRelative,
                only: 'functions:' + functionName,
            }).then(function () {
                console.log('Rules have been deployed!')
            }).catch(function (err) {
                console.log(err)
            }));
        }

        return BbPromise.all(promises);
    },
};
