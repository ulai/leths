"use strict"

const _ = require('lodash'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger('leths'),
      Client = require('./client'),
      WebServer = require('./webserver'),
      mqtt = new (require('./mqtt')),
      blockrain = require('./blockrain'),
      timeouts = require('./timeouts'),
      settings = require('./settings')

const clients = { text: [], light: [], neuron: []}

log.info('leths starting')

process.chdir(__dirname)
process.on('uncaughtException', (err) => {
  log.error(`uncaughtException: ${err.stack}`)
})

const ws = new WebServer(clients, settings.getWebServerPort())

log.info(
  'initialising: %d text, %d light, %d neuron',
  config.omegas.text.length,
  config.omegas.light.lights.length,
  config.omegas.neuron.neurons.length)

_.each(config.omegas, (devices, type) => {
  ({
    'text':   devices => _.each(devices, device => {
                var client = new Client(device, ws, {'text': device.text})
                clients.text.push(client)
              }),
    'light':  devices => {
                let pos = {x: 0, y: 0}
                _.each(devices.lights, device => {
                  var client = new Client(device, ws, {light: 1})
                  client.pos = _.clone(pos)
                  pos.x++
                  if(pos.x === devices.size.x) {
                    pos.y++
                    pos.x = 0
                  }
                  clients.light.push(client)
                })
              },
    'neuron': devices => {
                var c = config.omegas.neuron
                _.forOwn(devices.neurons, (device, i) => {
                  var client = new Client(device, ws, {'neuron' : {
                        movingAverageCount:c.movingAverageCount,
                        threshold:c.threshold,
                        numAxonLeds:device.numAxonLeds,
                        numBodyLeds:c.numBodyLeds,
                    }}, () => {
                      client.on('sensor', () => {
                        log.info('on sensor')
                        _.each(_.filter(clients.light,
                          l => Math.abs(l.pos.x - device.x) < 2 && Math.abs(l.pos.y - device.y) < 2), c => {
                            c.send({cmd: 'fade', to: .5, time: 100})
                            timeouts.add(`lightFadeBack.${c.pos.x}.${c.pos.y}`, () => c.send({cmd: 'fade', to: 1, time: 1e3}), 10e3)
                          })
                        mqtt.publish('neurons', {[i]: true})
                        timeouts.add(`mqttReset.${i}`, () => {
                          mqtt.publish('neurons', {[i]: false})
                        }, 10e3)
                      })
                    })
                    clients.neuron.push(client)
                  })
                }
  }[type])(devices);
})

const tetris = blockrain.game()
tetris.create({
  onGameOver: () => log.debug('onGameOver'),
  onPlaced: () => log.debug('onPlaced'),
  onLine: () => log.debug('onLine'),
  drawBlock: b => {
    if(b.x < 0 || b.y < 0) return
    _.filter(clients.light, l => l.pos.x == b.x && l.pos.y == b.y)[0]
      .send({cmd: 'fade', to: 1, time: 0})
  },
  clear: () => {
    _.each(clients.light, l => {
      l.send({cmd: 'fade', to: 0.5, time: 0})
    })
  }
})

var lightTimer, lightPos = 0
ws.on('light', x => {
  if(x.clear) _.each(clients.light, l => l.send({cmd: 'fade', to: 1, time: 0}))
  if('tetris' in x) x.tetris ? tetris.resume() : tetris.pause()
  if('test' in x) {
    if(x.test && !lightTimer) {
      lightTimer = setInterval(() => {
        if(lightPos == clients.light.length) lightPos = 0
        _.each(clients.light, l => l.send({cmd: 'fade', to: 1, time: 0}))
        clients.light[lightPos++].send({cmd: 'fade', to: 0.5, time: 0})
      }, 50)
    } else {
      clearInterval(lightTimer)
      lightTimer = null
    }
  }
})
