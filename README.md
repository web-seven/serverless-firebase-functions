# Serverless Firebase Functions Plugin

This plugin enables support for HTTP/PubSub NodeJS/TypeScript [Firebase Functions](https://firebase.google.com/products/functions/) within the [Serverless Framework](https://github.com/serverless/serverless).

## Highlights

* Convert transparent HTTP and PubSub functions to Firebase compatible function
* Deploy Firebase Function sources individually, no more another function sources deployed !!!
* Deploy any HTTP handler based on Express request/response to Firebase Functions without any adaptation.
* Support TypeScript functions
* Based on [serverless-webpack](https://www.npmjs.com/package/serverless-webpack) plugin for package sources
* Based on official [Firebase Tools](https://www.npmjs.com/package/firebase-tools) and [Firebase Admin](https://www.npmjs.com/package/firebase-admin)
* Support NPM and Yarn for packaging

## Install

```bash
$ npm install serverless-firebase-functions --save-dev
```

Add the plugin to your `serverless.yml` file:

```yaml
plugins:
  - serverless-firebase-functions
```

## Configure
Requried to configure Firebase Serverless provider and standard configuration for Firebase Functions deploy.

```yaml
provider:
  name: firebase
  stage: dev
  runtime: nodejs8
  region: myFirebaseDeployRegion #eg. "us-central1". See there: https://firebase.google.com/docs/functions/locations
  project: myFireabaseProjectName #See there: https://firebase.google.com/docs/projects/learn-more
  accessToken: myFirebaseAccessToken #See how to generate it there: https://www.npmjs.com/package/firebase-tools#using-with-ci-systems

functions:
  myHttpFunction:
    handler: handlers/myHandlerFile.myFunctionName
    events:
      - http: 
          path: myHttpUrlPath
          method: GET|PUT|POST|DELETE
  myPubSubFunction:
    handler: handlers/myHandlerFile.myFunctionName
    events:
      - pubsub: 
          topic: myPubSubMessageTopic
```

## Deployment

```bash
$ serverless deploy
```

## To Do
- [x] Use webpack to deploy function with packed dependencies.
- [x] Deploy functions clean, without other handler sources.
- [x] Add PubSub functions support.
- [x] Base on pure Firebase Tools API.
- [ ] Optimize deployment, make it parallel for every function.
- [ ] Make possible to deploy external packages functions from "node_modules", just by mention them in config.
