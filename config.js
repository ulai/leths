const yaml = require('js-yaml'),
      fs   = require('fs'),
      utils = require('./utils'),
      _ = require('lodash'),
      log = require('./logger').getLogger('config')

/** @module config
 * see comments in config.yaml
 */

function getConfig() {
  return yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'))
}

module.exports = {
  getConfig() {
    if(!this.config) this.config = getConfig()
    return this.config
  },
  getAddresses() {
    return _.map(_.flatten(_.at(this.getConfig(), ['omegas.text', 'omegas.light.lights', 'omegas.neuron.neurons'])), 'addr')
  },
  getIps() {
    return _.map(this.getAddresses(), utils.getHostAndPort)
  },
  check() {
    let ips = this.getIps()
    let duplicateIps = _.pickBy(_.countBy(ips), x => x > 1)
    if(duplicateIps) {
      log.warn('Config contains duplicate ips: %j', duplicateIps)
    }
  }
};
