const functions = require('firebase-functions');
const handler = require('./{{handlerPath}}');

exports.{{functionName}} = functions.region('{{region}}').https.onRequest(handler.{{handlerFunction}});