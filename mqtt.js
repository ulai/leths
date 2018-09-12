const mqtt = require('mqtt'),
      log = require('./logger').getLogger('mqtt'),
      _ = require("lodash"),
      status = {}

class Mqtt {
  constructor() {
    this.client  = mqtt.connect('ws://localhost:1884')
    this.client.on('connect', () => {
      log.info('connected')
    })
  }
  publish(topic, msg) {
    log.debug(`publish %s %j`, topic, msg)
    var key = _.keys(msg)[0]
    if (status[key]!=msg[key]) {
      status[key] = msg[key]
      this.client.publish(topic, JSON.stringify(msg))
    }
  }
}

module.exports = Mqtt
