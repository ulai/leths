const _ = require('lodash'),
      net = require('net'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger()

function connect(device, init) {
  var [host, port] = getHostAndPort(device.addr)
  host = `${host}%${config.default.interface}`
  port = port || config.default.port
  this.client = net.connect({ host: host, port: port}, (err) => {
    if(err) return;
    log.info(`connected to ${host}:${port}`)
    if(init) init()
  })
  this.client.on('data', ondata).on('error', onerror).on('end', onend)
}

function ondata(data) {
  log.info(`ondata ${data}`)
  return
  clearTimeout(this.timeout)
}

function onerror(err) {
  log.warn(`bus: connection failed: ${JSON.stringify(err)}`)
  //clearTimeout(this.timeout)
  //this._reconnect(1e3)
}

function onend() {
  log.warn(`bus: connection ended: ${JSON.stringify(this.addr)}`)
  clearTimeout(this.timeout)
  this._reconnect(1e3)
}

function getHostAndPort(addr) {
  if(addr.match(/ /)) return addr.split(' ')
  if(addr.length == 17) return [ipv6LocalFromMac(addr)]
  return [addr]
}

function ipv6LocalFromMac(mac) {
  m = mac.split(':')
  m[0] = (parseInt(m[0], 16) ^ 0x02).toString(16)
  return `fe80::${m[0]}${m[1]}:${m[2]}ff:fe${m[3]}:${m[4]}${m[5]}`
}

function send(cmd) {
  log.info(`t=${(new Date()).getTime()}, cmd=${cmd}`)
  this.client.write(getCommand(cmd));
}

function getCommand(cmd) {
  return JSON.stringify(cmd) + "\n";
}

class Client {
  constructor(device, init) {
    connect(device, init);
  }
  send(cmd) {
    send(cmd);
  }
}

module.exports =  Client;
