'use strict';

require('dotenv').config();
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const _ = require('lodash');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const fileDuration = require('../helpers/file-duration');
const settings = require('../../settings');
const logger = require('sonos-discovery/lib/helpers/logger');
const util = require('util');
const globalSettings = require('../../settings');

async function downloadFile(phrase, language) {

  if (!language) {
    language = 'pl-PL';
  }

  // Check if file already exists
  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `google-tts-api-${phraseHash}-${language}.mp3`;
  const filepath = path.resolve(settings.webroot, 'tts', filename);
  const expectedUri = `/tts/${filename}`;
  try {
    fs.accessSync(filepath, fs.R_OK);
    logger.info(`File for this phrase (${filepath}) already exists`);
    return fileDuration(filepath)
      .then((duration) => {
        return {
          duration,
          uri: expectedUri
        };
      });
  } catch (err) {
    logger.info(`announce file for phrase "${phrase}" does not seem to exist, downloading`);
  }

  // Construct the request
  const request = {
    input: {
      ssml: phrase
    },
    // Select the language and SSML voice gender (optional)
    voice: {languageCode: language, name: `${language}-Wavenet-B`},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);

  // // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(filepath, response.audioContent, 'binary');

  return fileDuration(filepath)
    .then((duration) => {
      return {
        duration,
        uri: expectedUri
      };
    });
  // return 'Audio content written to file: output.mp3';
}

function googleTtsApi(phrase, language) {
  if (!globalSettings.googleTtsApi) {
    return Promise.resolve();
  }
  return downloadFile(phrase, language);
}

module.exports = googleTtsApi;
