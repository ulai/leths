"use strict"

const { exec } = require('child_process'),
      readline = require('readline'),
      _ = require('lodash'),
      config = require('./config').getConfig(),
      utils = require('./utils')

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

rl.on('line', function(line){
  p[0].kill()
})

const clients = { text: [], light: [], neuron: []}

const lethd = './lethdx86'

_.each(config.omegas, (devices, type) => {
  console.log(clients[type]);
  ({
    'text':   devices => _.each(devices.texts, _.partialRight(startLethd, clients[type])),
    'light':  devices => _.each(devices.lights, _.partialRight(startLethd, clients[type])),
    'neuron': devices => _.each(devices.neurons, _.partialRight(startLethd, clients[type])),
  }[type])(devices);
})

function startLethd(device, clients) {
  console.log(device);
  var [host, port] = utils.getHostAndPort(device.addr)
  console.log(`starting ${port}`)
  var fds = ['ledchain1', 'ledchain2', 'pwmdimmer', 'sensor0']

  var p = exec(`${lethd} --lethdapiport ${port} --ledchain1 fdsim./tmp/`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return;
    }
    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
  })
  console.dir(clients);
  //clients.push(p)
}
