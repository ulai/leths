const _ = require('lodash'),
      net = require('net'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger(),
      utils = require('./utils');

function connect(device, init) {
  this.reconnectParams = {device, init}
  var [host, port] = utils.getHostAndPort(device.addr)
  host = `${host}%${config.default.interface}`
  port = port || config.default.port
  log.info(`connection to ${host}:${port}`)
  this.client = net.connect({ host: host, port: port}, () => {
    this.online = true
    log.info(`connected to ${host}:${port}`)
    if(init) init()
  })
  this.client.on('data', ondata.bind(this)).on('error', onerror.bind(this)).on('end', onend.bind(this))
}

function ondata(data) {
  this.buffer = this.buffer || '' + data.toString()
  if(!this.buffer.endsWith('\n')) return
  _.each(this.buffer.split('\n').filter(String), (b) => {
    try {
      data = JSON.parse(b);
    } catch(e) {
      log.error(`ondata: json parse error '${e}' : ${JSON.stringify(data)}`)
      return
    } finally {
      this.buffer = ''
    }
    log.info(`ondata: ${JSON.stringify(data)}`)
    if(data) {      
      if(this.receiveCb) this.receiveCb(data)
      clearTimeout(this.timeout)
    }
  })
}

function onerror(err) {
  this.online = false
  log.warn(`onerror: ${this.addr} ${JSON.stringify(err)}`)
}

function onend() {
  this.online = false
  log.warn(`onend: ${this.addr}`)
}

function send(cmd, cb) {
  log.info(`t=${(new Date()).getTime()}, cmd=${cmd}`)
  this.receiveCb = cb;
  this.timeout = setTimeout(() => {
    log.error(`timeout`);
  }, 1e3);
  this.client.write(getCommand(cmd));
}

function getCommand(cmd) {
  return JSON.stringify(cmd) + "\n";
}

class Client {
  constructor(device, init) {
    connect.bind(this)(device, init);
  }
  send(cmd, cb) {
    send.bind(this)(cmd, cb);
  }
}

module.exports = Client;
