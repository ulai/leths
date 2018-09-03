const mqtt = require('mqtt'),
      log = require('./logger').getLogger('mqtt')

class Mqtt {
  constructor() {
    this.client  = mqtt.connect('ws://localhost:1884')
    this.client.on('connect', () => {
      log.info('connected')
    })
  }
  publish(topic, msg) {
    log.info(`publish %s %j`, topic, msg)
    this.client.publish(topic, JSON.stringify(msg))
  }
}

module.exports = Mqtt