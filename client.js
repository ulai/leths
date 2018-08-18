const _ = require('lodash'),
      net = require('net'),
      config = require('./config').getConfig(),
      utils = require('./utils'),
      reconnect = require('reconnect-net'),
      EventEmitter = require('events')

function connect(device, init) {
  var [host, port] = utils.getHostAndPort(device.addr)
  host = `${host}%${config.default.interface}`
  port = port || config.default.port
  this.log.debug('connecting to %s:%s', host, port)
  reconnect(client => {
    this.client = client
    client.on('data', ondata.bind(this))
    this.online = true
    this.log.info('connected to %s:%s', host, port)
    if(init) init()
  }).connect({host, port}).on('error', onerror.bind(this)).on('end', onend.bind(this))
}

function ondata(data) {
  this.buffer = this.buffer || '' + data.toString()
  if(!this.buffer.endsWith('\n')) return
  _.each(this.buffer.split('\n').filter(String), (b) => {
    try {
      data = JSON.parse(b);
    } catch(e) {
      log.error('json parse error %j for %s', e, b)
      return
    } finally {
      this.buffer = ''
    }
    this.log.info('ondata %j', data)
    if(data) {
      if('sensor' in data) {
        this.emit('sensor')
      }
      if(this.receiveCb) this.receiveCb(data)
      clearTimeout(this.timeout)
    }
  })
}

function onerror(err) {
  this.online = false
  this.log.warn('onerror %j', err)
}

function onend() {
  this.online = false
  this.log.warn('onend')
}

function send(cmd, cb) {
  this.log.info('send %j', cmd)
  if(cb) {
    this.receiveCb = cb;
    this.timeout = setTimeout(() => {
      this.log.error(timeout, cmd)
    }, 1e3)
  }
  this.client.write(getCommand(cmd))
}

function getCommand(cmd) {
  return JSON.stringify(cmd) + "\n";
}

class Client extends EventEmitter {
  constructor(device, init) {
    super()
    this.log = require('./logger').getLogger(`client.${device.addr}`)
    this.online = false
    this.device = device
    connect.bind(this)(device, init)
  }
  send(cmd, cb) {
    send.bind(this)(cmd, cb)
  }
}

module.exports = Client
