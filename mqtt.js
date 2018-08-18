const mqtt = require('mqtt'),
      log = require('./logger').getLogger('mqtt')

class Mqtt {
  constructor() {
    this.client  = mqtt.connect('mqtt://localhost')
    this.client.on('connect', () => {
      log.info('connected')
    })
  }
  publish(topic, msg) {
    log.info(`publish topic:${topic}`, msg)
    this.client.publish(topic, msg)
  }
}
