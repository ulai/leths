const yaml = require('js-yaml'),
      fs   = require('fs')

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
  }
};
