'use strict';

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const Handlebars = require('handlebars');
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

                const functionTemplate = fs.readFileSync(__dirname + '/templates/index.tpl', 'utf8');
                const template = Handlebars.compile(functionTemplate);
                const handlerParts = functionObject.handler.split('.');
                const handlerPath = handlerParts.shift();
                var handlerFunction = 'default';
                if (handlerParts.length > 0) {
                    handlerFunction = handlerParts.join('.');
                }

                const contents = template({
                    handlerPath: handlerPath,
                    functionName: functionName,
                    handlerFunction: handlerFunction,
                    region: this.serverless.service.provider.region
                });

                fs.writeFileSync(path.join(functionPath, 'index.js'), contents);

                var functionPackageJson = require(path.join(functionPath, 'package.json'));
                functionPackageJson.engines = {
                    node: "8"
                };
                functionPackageJson.dependencies['firebase-functions'] = '3.1.0';
                functionPackageJson.dependencies['firebase-admin'] = '8.2.0';
                fs.writeFileSync(path.join(functionPath, 'package.json'), JSON.stringify(functionPackageJson));
                readyFunctionsForDeploy.push(functionName);
            });

        return BbPromise.resolve();
    },
};
