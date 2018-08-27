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

})

const clients = { text: [], light: [], neuron: []}

const lethd = './lethdx86'

_.each(config.omegas, (devices, type) => {
  ({
    'text':   devices => _.each(devices, startLethd),
    'light':  devices => _.each(devices.lights, startLethd),
    'neuron': devices => _.each(devices.neurons, startLethd),
  }[type])(devices);
})

function startLethd(device) {
  var [host, port] = utils.getHostAndPort(device.addr)
  console.log(`starting ${port}`);
  exec(`${lethd} --lethdapiport ${port}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  })
}
