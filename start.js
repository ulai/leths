const _ = require('lodash'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger(),
      Client = require('./client');

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
      client.send({cmd:'init', 'text': device.text});
    });
    clients.push(client);
  });
}

function initLight(devices) {
  _.each(devices.cells, (device) => {
    var client = new Client(device, () => {
      client.send({cmd:'echo'});
    });
    clients.push(client);
  });
}

function initNeuron(devices) {
  _.each(devices, (device) => {
    var client = new Client(device, () => {
      client.send({cmd:'init', 'neuron': true});
    });
    clients.push(client);
  });
}

setTimeout(() => {
  _.each(clients, (c, i) => {
    c.send({cmd:'echo'});
  });
}, 1e3);
