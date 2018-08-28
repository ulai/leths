"use strict"

const _ = require('lodash'),
      Client = require('./client'),
      mqtt = new (require('./mqtt')),
      timeouts = require('./timeouts'),
      blockrain = require('./blockrain'),
      log = require('./logger').getLogger('features')

module.exports = {
  initText: (devices, clients, config, ws) => {
    var conf = config.omegas.text
    var startScroll = _.debounce(c => {
      _.each(clients.text, c => c.send({feature: 'text', cmd: 'stopscroll'}))
      Promise.all(
      clients.text.map(
      async c => { return new Promise(resolve => c.send({cmd: 'status'}, resolve)) })).then(status => {
        var offsetx = _.maxBy(_.values(_.groupBy(_.map(status, "features.text.scrolloffsetx"))),'length')[0]
        _.each(clients.text, c => c.send({feature: 'text', offsetx: offsetx}))
        _.each(clients.text, c => c.send({feature: 'text', text: conf.defaultText}))
        _.each(conf.settings, s => {
          _.each(clients.text, c => c.send(_.merge({feature: 'text'}, s)))
        })
        let o = {feature: 'text', cmd: 'startscroll', start: (new Date).getTime() + 200}
        o = _.merge(o, conf.scrollSettings)
        _.each(clients.text, c => c.send(o))
      })
    }, 10, {leading: false, trailing: true})
    _.each(devices.texts, device => {
      var client = new Client(device, ws, {'text': device.text}, () => {
        if(_.every(clients.text, 'online')) {
          startScroll()
        }
      })
      clients.text.push(client)
    })
  },
  initLight: (devices, clients, config, ws) => {
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
  initNeuron: (devices, clients, config, ws)  => {
    var conf = config.omegas.neuron
    _.forOwn(devices.neurons, (device, i) => {
      var client = new Client(device, ws, {'neuron' : {
            movingAverageCount:conf.movingAverageCount,
            threshold:conf.threshold,
            numAxonLeds:device.numAxonLeds,
            numBodyLeds:conf.numBodyLeds,
      }})
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
      clients.neuron.push(client)
    })
  },
  initLightTests: (clients, ws) => {
    const tetris = blockrain.game()
    tetris.initialize(clients)

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
  }
}
