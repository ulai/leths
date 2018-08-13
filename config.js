const yaml = require('js-yaml'),
      fs   = require('fs');

/** @module config */

module.exports = {
  getConfig() {
    if(!this.config) this.config = getConfig();
    return this.config;
  },
};

function getConfig() {
  return yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
}
