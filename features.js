"use strict"

const _ = require('lodash'),
      Client = require('./client'),
      mqtt = new (require('./mqtt')),
      timeouts = require('./timeouts'),
      blockrain = require('./blockrain'),
      log = require('./logger').getLogger('features'),
      saveConfig = require('./config').saveConfig

module.exports = {
  initText: (devices, clients, config, ws) => {
    var conf = config.omegas.text
    ws.on('text', x => {
      if(x.textclear) _.each(clients.text, l => l.send({feature:'text', scene: { type:'text', label:'TEXT', wrapmode:3, sizetocontent:true }}))
      if(x.scene) _.each(clients.text, l => l.send({feature:'text', scene: (x.scene.charAt(0)=='/' ? x.scene : (x.scene.charAt(0)=='{' ?  JSON.parse(x.scene) : 'scenes/'+x.scene+'.json'))}))
      if(x.textdefault) {
        _.each(clients.text, l => l.send({feature:'text', scene: { type:'text', label:'TEXT', wrapmode:3, sizetocontent:true }}))
        _.each(conf.settings, s => {_.each(clients.text, l => l.send(_.merge({feature:'text'}, s)))})
      }
    })

    var startScroll = _.debounce(c => {
      _.each(clients.text, c => c.send({feature: 'text', cmd: 'stopscroll'}))
      Promise.all(
      clients.text.map(
      async c => { return new Promise(resolve => c.send({cmd: 'status'}, resolve)) })).then(status => {
        var offsetx = _.maxBy(_.values(_.groupBy(_.map(status, "features.text.scrolloffsetx"))),'length')[0]
        _.each(clients.text, c => c.send({feature: 'text', offsetx: offsetx}))
        _.each(conf.settings, s => {
          _.each(clients.text, c => c.send(_.merge({feature: 'text'}, s)))
        })
        let o = {feature: 'text', cmd: 'startscroll', start: (new Date).getTime() + 200}
        o = _.merge(o, conf.scrollSettings)
        _.each(clients.text, c => c.send(o))
      })
    }, 10, {leading: false, trailing: true})
    _.each(devices.texts, device => {
      var client = new Client(device, ws, {'gridcoordinate': device.gridcoordinate, 'text': device.text }, () => {
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
      var client = new Client(device, ws, {'gridcoordinate': device.gridcoordinate, 'light': 1})
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
      var client = new Client(device, ws, {'gridcoordinate': device.gridcoordinate, 'neuron' : {
            movingAverageCount:conf.movingAverageCount,
            threshold:conf.threshold,
            numAxonLeds:device.numAxonLeds,
            numBodyLeds:conf.numBodyLeds,
      }})
      client.on('sensor', () => {
        log.debug('on sensor')
        _.each(clients.light, l => {
          l.send({feature:'light', cmd: 'fade', to: .3, t: 100})
          timeouts.add(`lightFadeBack.${l.pos.x}.${l.pos.y}`, () => l.send({feature:'light', cmd: 'fade', to: .6, t: 2e3}), 5e3)
        })
        mqtt.publish('neurons', {[i]: true})
        timeouts.add(`mqttReset.${i}`, () => {
          mqtt.publish('neurons', {[i]: false})
        }, 1.5e3)
        _.each(device.neighbours, j => clients.neuron[j].send({feature:'neuron', cmd: 'glow'}))
      })
      clients.neuron.push(client)
    })
  },
  initMisc: (clients, config, ws) => {
    ws.on('mute', b => {
      _.each(clients.neuron, n => n.send({feature:'neuron', cmd: 'mute', on: !!b}))
    })
    ws.on('groundlight', b => {
      _.each(clients.light, l => l.send({feature:'light', cmd: 'fade', to: b, t: 0}))
    })
    ws.on('config', c => {
      if(c.save) {
        saveConfig(config)
        process.exit()    
      }
      if(c.mute) {
        _.find(config.omegas[c.mute.t][c.mute.t+'s'], {'addr': c.mute.c.device.addr}).mute = c.mute.b;
      }
    })
  },
  initLightTests: (clients, ws) => {
    const tetris = blockrain.game()
    tetris.initialize(clients)

    var lightTimer, lightPos = 0, noiseTimer, waveTimer, wavePhi = 0

    ws.on('light', x => {
      if(x.clear) _.each(clients.light, l => l.send({feature:'light', cmd: 'fade', to: 1, t: 0}))
      if('tetris' in x) x.tetris ? tetris.resume() : tetris.pause()
      if('test' in x) {
        if(x.test && !lightTimer) {
          lightTimer = setInterval(() => {
            if(lightPos == clients.light.length) lightPos = 0
            _.each(clients.light, l => l.send({feature:'light', cmd: 'fade', to: 0, t: 0}))
            clients.light[lightPos++].send({feature:'light', cmd: 'fade', to: 1, t: 0})
          }, 100)
        } else {
          clearInterval(lightTimer)
          lightTimer = null
        }
      }
      if('noise' in x) {
        if(x.noise && !noiseTimer) {
          noiseTimer = setInterval(() => {
            _.each(clients.light, l => l.send({feature:'light', cmd: 'fade', to: Math.random(), t: 0}))
          }, 50)
        } else {
          clearInterval(noiseTimer)
          noiseTimer = null
        }
      }
      if('wave' in x) {
        if(x.wave && !waveTimer) {
          waveTimer = setInterval(() => {
            wavePhi += 0.1;
            _.each(clients.light, l => {
              l.send({feature:'light', cmd: 'fade', to: Math.abs(Math.sin((l.pos.x / 10 * Math.PI) + wavePhi)), t: 0})
            })
          }, 50)
        } else {
          clearInterval(waveTimer)
          waveTimer = null
        }
      }
    })
  }
}
