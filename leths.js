"use strict"

const _ = require('lodash'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger('leths'),
      Client = require('./client'),
      WebServer = require('./webserver'),
      mqtt = new (require('./mqtt'))

var clients = { text: [], light: [], neuron: []}

log.info('leths starting')

process.chdir(__dirname)
process.on('uncaughtException', (err) => {
  log.error(`uncaughtException: ${err.stack}`)
})

log.info(
  'initialsing: %d text, %d light, %d neuron',
  config.omegas.text.length,
  config.omegas.light.cells.length,
  config.omegas.neuron.neurons.length)

_.each(config.omegas, (devices, type) => {
  ({
    'text':   (devices) => _.each(devices, (device) => {
                var client = new Client(device, () => {
                  client.send({cmd:'init', 'text': device.text})
                  client.send({cmd:'status'}, status => device.status = status)
                })
                clients.text.push(client)
              }),
    'light':  (devices) => _.each(devices.cells, (device) => {
                var client = new Client(device, () => {
                  client.send({cmd:'init', light: 1})
                  client.send({cmd:'status'}, status => device.status = status)
                })
                clients.light.push(client)
              }),
    'neuron': (devices) => {
                var c = config.omegas.neuron
                _.forOwn(devices.neurons, (device, i) => {
                  var client = new Client(device, () => {
                    client.send({cmd:'init', 'neuron' : {
                        movingAverageCount:c.movingAverageCount,
                        threshold:c.threshold,
                        numAxonLeds:device.numAxonLeds,
                        numBodyLeds:c.numBodyLeds,
                    }})
                    client.send({cmd:'status'}, status => device.status = status)
                    client.on('sensor', () => {
                      let o = {}
                      o[i] = true
                      mqtt.publish('neurons', o)
                    })
                  })
                  clients.neuron.push(client)
                })
              }
  }[type])(devices);
})

const webServer = new WebServer(clients, 3333)
