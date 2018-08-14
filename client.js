const _ = require('lodash'),
      net = require('net'),
      config = require('./config').getConfig(),
      log = require('./logger').getLogger()

function connect(device, init) {
  this.reconnectParams = {device, init}
  var [host, port] = getHostAndPort(device.addr)
  host = `${host}%${config.default.interface}`
  port = port || config.default.port
  this.client = net.connect({ host: host, port: port}, (err) => {
    if(err) {
      log.warn(`error connect: ${this.addr} ${JSON.stringify(err)}`)
      reconect.bind(this)();
    }
    log.info(`connected to ${host}:${port}`)
    if(init) init()
  })
  this.client.on('data', ondata.bind(this)).on('error', onerror.bind(this)).on('end', onend.bind(this))
}

function ondata(data) {
  data = JSON.parse(data.toString());
  clearTimeout(this.timeout)
  log.info(`ondata: ${JSON.stringify(data)}`)
  this.receiveCb(data);
}

function onerror(err) {
  log.warn(`onerror: ${this.addr} ${JSON.stringify(err)}`)
}

function onend() {
  log.warn(`onend: ${this.addr}`)
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
