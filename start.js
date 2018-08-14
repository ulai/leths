const _ = require('lodash'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger(),
      Client = require('./client'),
      WebServer = require('./webserver');

var clients = [];

_.forOwn(config.omegas, (devices, type) => {
  ({
    'text': initText,
    'light': initLight,
    'neuron': initNeuron,
  }[type])(devices);
});

function initText(devices) {
  _.each(devices, (device) => {
    var client = new Client(device, () => {
      client.send({cmd:'init', 'text': device.text}, () => {})
    })
    clients.push(client)
  });
}

function initLight(devices) {
  _.each(devices.cells, (device) => {
    var client = new Client(device, () => {
      client.send({cmd:'init', light:1}, () => {})
    })
    clients.push(client)
  });
}

function initNeuron(devices) {
  var c = config.omegas.neuron
  _.each(devices.neurons, (device) => {
    var client = new Client(device, () => {
      client.send({cmd:'init', 'neuron': {
        movingAverageCount:c.movingAverageCount,
        threshold:c.threshold,
      }}, () => {})
    })
    clients.push(client)
  })
}

setTimeout(() => {
  _.each(clients, (c, i) => {
    c.send({cmd:'now'}, () => {})
  })
}, 1e3)

const webServer = new WebServer(3333)
