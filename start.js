"use strict"

const _ = require('lodash'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger(),
      Client = require('./client'),
      WebServer = require('./webserver');

var clients = { text: [], light: [], neuron: []}

_.each(config.omegas, (devices, type) => {
  ({
    'text':   (devices) => _.each(devices, (device) => {
                var client = new Client(device, () => {
                  client.send({cmd:'init', 'text': device.text}, () => {})
                })
                clients.text.push(client)
              }),
    'light':  (devices) => _.each(devices.cells, (device) => {
                var client = new Client(device, () => {
                  client.send({cmd:'init', light:1}, () => {})
                })
                clients.light.push(client)
              }),
    'neuron': (devices) => {
                var c = config.omegas.neuron
                _.each(devices.neurons, (device) => {
                  var client = new Client(device, () => {
                    client.send({cmd:'init', 'neuron': {
                      movingAverageCount:c.movingAverageCount,
                      threshold:c.threshold,
                    }}, () => {})
                  })
                  clients.neuron.push(client)
                })
              }  
  }[type])(devices);
})

const webServer = new WebServer(clients, 3333)