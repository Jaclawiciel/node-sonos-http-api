'use strict';

const logger = require('sonos-discovery/lib/helpers/logger');
const path = require('path');
const requireDir = require('sonos-discovery/lib/helpers/require-dir');
const providers = [];

providers.push(require('../tts-providers/google-tts-api'));
providers.push(require('../tts-providers/google'));


function tryDownloadTTS(phrase, language) {
  let result;
  return providers.reduce((promise, provider) => {
    logger.info(provider);
    return promise.then(() => {
      if (result) return result;
      return provider(phrase, language)
        .then((_result) => {
          result = _result;
          logger.info(result);
          return result;
        });
      });
  }, Promise.resolve());
}

module.exports = tryDownloadTTS;
