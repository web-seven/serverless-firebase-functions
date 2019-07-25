'use strict';

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const Handlebars = require('handlebars');
const dependencies = require('../../package.json').dependencies
const BbPromise = require('bluebird');

module.exports = {
    createDeployment() {
        return BbPromise.bind(this)
            .then(this.create);
    },

    create(foundDeployment) {
        if (foundDeployment) return BbPromise.resolve();
        this.serverless.cli.log('Prepare Firebase structure...');
        const firebasePath = path.join('.serverless', 'firebase', 'functions');
        const artifactsPath = path.join(this.serverless.config.servicePath, firebasePath);
        const options = this.options;
        var readyFunctionsForDeploy = this.readyFunctionsForDeploy;
        this.serverless.service.getAllFunctions()
            .filter(functionName => {
                if (typeof options.function === 'string') {
                    if (options.function === functionName) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            })
            .forEach(functionName => {
                this.serverless.cli.log('Extracting function: ' + functionName);
                var functionObject = this.serverless.service.getFunction(functionName);
                var artifactPath = path.resolve(functionObject.package.artifact);
                var functionPath = path.resolve(path.join(artifactsPath, functionName));
                var zip = new AdmZip(artifactPath);
                zip.extractAllTo(functionPath, true);
                this.serverless.cli.log('Function "' + functionName + '" artifact extracted to Firebase structure.');

                const handlerParts = functionObject.handler.split('.');
                const handlerPath = handlerParts.shift();
                var handlerFunction = 'default';
                if (handlerParts.length > 0) {
                    handlerFunction = handlerParts.join('.');
                }

                var templateVariables = {
                    handlerPath: handlerPath,
                    functionName: functionName,
                    handlerFunction: handlerFunction,
                    region: this.serverless.service.provider.region
                }

                var functionTemplateType = 'index';
                functionObject.events.forEach((event) => {
                    Object.keys(event).forEach((key) => {
                        switch (key) {
                            case 'http':
                                functionTemplateType = 'http';
                                break;
                            case 'pubsub':
                                functionTemplateType = 'pubsub';
                                templateVariables['topic'] = event.topic
                                break;
                        }
                    })
                })

                const functionTemplate = fs.readFileSync(__dirname + '/templates/' + functionTemplateType + '.hbs', 'utf8');
                const contents = Handlebars.compile(functionTemplate)(templateVariables);

                fs.writeFileSync(path.join(functionPath, 'index.js'), contents);

                const functionPackageJsonPath = path.join(functionPath, 'package.json');
                const functionFirebaseJsonPath = path.join(functionPath, 'firebase.json');
                var functionPackageJson = { dependencies: {} };
                if (fs.existsSync(functionPackageJsonPath)) {
                    functionPackageJson = require(functionPackageJsonPath)
                }
                functionPackageJson.engines = {
                    node: "8"
                };
                functionPackageJson.dependencies['firebase-functions'] = dependencies['firebase-functions'];
                functionPackageJson.dependencies['firebase-admin'] = dependencies['firebase-admin'];
                fs.writeFileSync(functionPackageJsonPath, JSON.stringify(functionPackageJson));
                fs.writeFileSync(functionFirebaseJsonPath, JSON.stringify({
                    "functions": {
                        "source": ''
                    }
                }));
                readyFunctionsForDeploy.push(functionName);
            });

        return BbPromise.resolve();
    },
};
