'use strict';
const OpenAI = require('openai');
const fs = require('fs');
const crypto = require('crypto');
const fileDuration = require('../helpers/file-duration');
const logger = require('sonos-discovery/lib/helpers/logger');
const path = require('path');
const util = require('util');
const globalSettings = require('../../settings');


const DEFAULT_SETTINGS = {
  model: 'tts-1',
  voice: 'alloy',
  enableCache: true
};

async function downloadFile(phrase) {
  const settings = Object.assign({}, DEFAULT_SETTINGS, globalSettings.whisper);

  const openai = new OpenAI({
    apiKey: settings.apiKey
  });

  const model = settings.model;
  const voice = settings.voice;
  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `whisper-${phraseHash}-${model}-${voice}.mp3`;
  const filepath = path.resolve(globalSettings.webroot, 'tts', filename);
  const expectedUri = `/tts/${filename}`;

  if (settings.enableCache) {
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
  } else {
    logger.info("Cache disabled");
  }

  const mp3 = await openai.audio.speech.create({
    model: model,
    voice: voice,
    input: phrase,
  });

  const writeFile = util.promisify(fs.writeFile);
  await writeFile(filepath, Buffer.from(await mp3.arrayBuffer()), 'binary');

  return fileDuration(filepath)
    .then((duration) => {
      return {
        duration,
        uri: expectedUri
      };
    });
}

function whisper(phrase, voiceName) {
  if (!globalSettings.whisper || !globalSettings.whisper.apiKey) {
    return Promise.resolve();
  }

  return downloadFile(phrase);
}

module.exports = whisper;
