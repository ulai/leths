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

//process.on('warning', e => console.warn(e.stack));

const ws = new WebServer(clients, 3333)

log.info(
  'initialising: %d text, %d light, %d neuron',
  config.omegas.text.length,
  config.omegas.light.lights.length,
  config.omegas.neuron.neurons.length)

_.each(config.omegas, (devices, type) => {
  ({
    'text':   (devices) => _.each(devices, (device) => {
                var client = new Client(device, ws, () => {
                  client.send({cmd:'init', 'text': device.text})
                  client.send({cmd:'status'}, status => device.status = status)
                })
                clients.text.push(client)
              }),
    'light':  (devices) => {
                let pos = {x: 0, y: 0}
                _.each(devices.lights, (device) => {
                  var client = new Client(device, ws, () => {
                    client.send({cmd:'init', light: 1})
                    client.send({cmd:'status'}, status => device.status = status)
                  })
                  client.pos = _.clone(pos)
                  pos.x++
                  if(pos.x === devices.size.x) {
                    pos.y++
                    pos.x = 0
                  }
                  clients.light.push(client)
                })
              },
    'neuron': (devices) => {
                var c = config.omegas.neuron
                _.forOwn(devices.neurons, (device, i) => {
                  var client = new Client(device, ws, () => {
                    client.send({cmd:'init', 'neuron' : {
                        movingAverageCount:c.movingAverageCount,
                        threshold:c.threshold,
                        numAxonLeds:device.numAxonLeds,
                        numBodyLeds:c.numBodyLeds,
                    }})
                    client.send({cmd:'status'}, status => device.status = status)
                    client.on('sensor', () => {
                      _.each(_.filter(clients.light,
                        l => Math.abs(l.pos.x - device.x) < 2 && Math.abs(l.pos.y - device.y) < 2), c => {
                          c.send({cmd: 'fade', to: .5, time: 100})
                          addTimeout(`lightFadeBack.${c.pos.x}.${c.pos.y}`, () => c.send({cmd: 'fade', to: 1, time: 1e3}), 10e3)
                        })
                      let o = {}
                      o[i] = true
                      mqtt.publish('neurons', o)
                      addTimeout(`mqttReset.${i}`, () => {
                        o[i] = false
                        mqtt.publish('neurons', o)
                      }, 10e3)
                    })
                  })
                  clients.neuron.push(client)
                })
              }
  }[type])(devices);
})

var timeouts = {}

function addTimeout(id, cb, t) {
  if(id in timeouts) clearTimeout(timeouts[id])
  timeouts[id] = setTimeout(() => {
    cb()
    delete(timeouts[id])
  }, t)
}
