const _ = require('lodash'),
      net = require('net'),
      reconnect = require('reconnect-net'),
      EventEmitter = require('events'),
      utils = require('./utils'),
      config = require('./config'),
      settings = require('./settings')

function connect(device, initArgs, addInit) {
  var [host, port] = utils.getHostAndPort(device.addr)
  var iface = config.getConfig().default.interface
  if(iface) host += `%${iface}`
  port = port || config.getConfig().default.port
  this.log.info('connecting to %s:%s', host, port)
  reconnect(client => {
    this.client = client
    this.online = true
    client.on('data', ondata.bind(this))
    this.log.info('connected to %s:%s', host, port)
    this.send(_.extend({cmd:'init'}, initArgs))
    this.send({cmd:'status'}, status => {
      this.device.status = status
      if(addInit) addInit()
    })
    setTimeout(pingTimer.bind(this), settings.getStartWatchdog())
  }).connect({host, port}).on('error', onerror.bind(this)).on('end', onend.bind(this))
}

function pingTimer() {
  this.send({cmd:'ping'}, pong => {
    clearTimeout(this.noConnectionTimeout)
    this.pingTimeout = setTimeout(pingTimer.bind(this), settings.getRepeatWatchdog())
  })
  this.noConnectionTimeout = setTimeout(() => {
    this.log.warn('ending connection')
    clearTimeouts.bind(this)
    this.client.destroy()
    this.online = false
  }, settings.getTimeout())
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
    this.log.debug('ondata %j', data)
    if(data) {
      if('sensor' in data) {
        this.log.info('sensor %j', data)
        this.emit('sensor')
      } else {
        if(this.receiveCb) this.receiveCb(data)
        clearTimeout(this.timeout)
      }
    }
  })
}

function onerror(err) {
  this.online = false
  clearTimeouts.bind(this)
  this.log.warn('onerror %j', err)
}

function onend() {
  this.online = false
  clearTimeouts.bind(this)
  this.log.warn('onend')
}

function clearTimeouts() {
  clearTimeout(this.noConnectionTimeout)
  clearTimeout(this.pingTimeout)
}

function send(cmd, cb) {
  if(!this.online) {
    this.log.warn('send %j fails, no connection', cmd)
    return
  }
  this.log.debug('send %j', cmd)
  if(cb) {
    this.receiveCb = cb;
    this.timeout = setTimeout(() => {
      this.log.warn('timeout %j', cmd)
    }, settings.getTimeout())
  }
  setTimeout(() => {
    this.client.write(getCommand(cmd))
  })
}

function getCommand(cmd) {
  return JSON.stringify(cmd) + "\n";
}

class Client extends EventEmitter {
  constructor(device, ws, args, init) {
    super()
    this.log = require('./logger').getLogger(`client.${device.addr} - ${device.gridcoordinate}`)
    this.online = false
    this.device = device
    this.ws = ws
    if(device.mute) {
      this.online = true;
      this.mute = true;
      return
    }
    connect.bind(this)(device, args, init)
  }
  send(cmd, cb) {
    if(this.mute) return
    send.bind(this)(cmd, cb)
    if(cmd.cmd === 'fade') {
      this.ws.light(cmd.to, this.pos)
    }
  }
}

module.exports = Client
