"use strict"

const _ = require('lodash'),
      utils = require('./utils'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger('leths'),
      Client = require('./client'),
      WebServer = require('./webserver'),
      settings = require('./settings'),
      features = require('./features.js')

const clients = { text: [], light: [], neuron: []}

log.info('leths starting')

process.chdir(__dirname)
process.on('uncaughtException', (err) => {
  log.error(`uncaughtException: ${err.stack}`)
})

const ws = new WebServer(clients, utils, settings.getWebServerPort())

log.info(
  'initialising: %d text, %d light, %d neuron',
  config.omegas.text.texts.length,
  config.omegas.light.lights.length,
  config.omegas.neuron.neurons.length)

_.each(config.omegas, (devices, type) => {
  ({
    'text':   features.initText,
    'light':  features.initLight,
    'neuron': features.initNeuron,
  }[type])(devices, clients, config, ws)
})

features.initMisc(clients, config, ws)
features.initLightTests(clients, ws)
