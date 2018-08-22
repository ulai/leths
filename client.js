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
  if(!this.online) {
    this.log.warn('send %j fails, no connection', cmd)
    return
  }
  this.log.info('send %j', cmd)
  if(cb) {
    this.receiveCb = cb;
    this.timeout = setTimeout(() => {
      this.log.error('timeout %j', cmd)
    }, 1e3)
  }
  setTimeout(() => {
    this.client.write(getCommand(cmd))
  })
}

function getCommand(cmd) {
  return JSON.stringify(cmd) + "\n";
}

class Client extends EventEmitter {
  constructor(device, ws, init) {
    super()
    this.log = require('./logger').getLogger(`client.${device.addr}`)
    this.online = false
    this.device = device
    this.ws = ws
    connect.bind(this)(device, init)
  }
  send(cmd, cb) {
    send.bind(this)(cmd, cb)
    if(cmd.cmd === 'fade') {
      this.ws.light(cmd.to, this.pos)
    }
  }
}

module.exports = Client
