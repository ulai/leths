const _ = require('lodash'),
      config = require('./config'),
      log = require('./logger').getLogger('utils'),
      exec = require('await-exec'),
      fs = require('fs')

function ipv6LocalFromMac(mac) {
  var m = mac.split(':')
  m[0] = (parseInt(m[0], 16) ^ 0x02).toString(16)
  return `fe80::${m[0]}${m[1]}:${m[2]}ff:fe${m[3]}:${m[4]}${m[5]}`
}

async function ping(addr, iface, expected) {
  var {stdout, stderr} = await exec(`ping6 -c1 ${addr}%${iface}`)
  if(!stdout.match(expected)) throw Error(`ping returned unexpected: ${stdout}`)
}

async function ssh(args, addr, iface, cmd, expected) {
  var {stdout, stderr} = await exec(`ssh ${args} root@${addr}%${iface} ${cmd}`)
  if(!stdout.match(expected)) throw Error(`${smd} lethd returned unexpected: ${stdout}`)
}

async function copy(addr, iface, lethd) {
  log.info(`start for ${addr}`)
  await ping(addr, iface, `bytes from ${addr}: icmp_seq=1 ttl=64`)
  var args = `-o StrictHostKeyChecking=no`
  await ssh(args, addr, iface, `sv stop lethd`, `ok: down: lethd:`)
  await exec(`scp  ${args} ${lethd} root@[\\${addr}%${iface}\\]:/usr/bin`)
  await ssh(args, addr, iface, `sv start lethd`, `ok: run: lethd:`)
  log.info(`successful for ${addr}`)
}

async function flash(addr, iface, image) {
  log.info(`start for ${addr}`);
  await ping(addr, iface, `bytes from ${addr}: icmp_seq=1 ttl=64`)
  var args = `-o StrictHostKeyChecking=no`
  await ssh(args, addr, iface, `sv status lethd`, `(run|down): lethd:`)
  await exec(`scp  ${args} ${image} root@[\\${addr}%${iface}\\]:/tmp/upgradeimage`)
  await exec(`ssh ${args} root@${addr}%${iface} sysupgrade /tmp/upgradeimage`).catch(err => {
    //Connection to fe80::42a3:6bff:fec1:8296%enp2s0 closed by remote host.
  })
  log.info(`successful for ${addr}`)
}

async function uci(addr, iface, settings, cmd) {
  log.info(`start for ${addr}`);
  await ping(addr, iface, `bytes from ${addr}(.*?): icmp_seq=1 ttl=64`)
  var ssh = `ssh -o StrictHostKeyChecking=no root@${addr}%${iface}`
  await _.map(settings.split(','), setting => {
    exec(`${ssh} uci set ${setting}`)
  })
  await exec(`${ssh} uci commit`)
  if(cmd) await exec(`${ssh} ${cmd}`)
  log.info(`successful for ${addr}`)
}

module.exports = {
  /**
    Gets ipv6 addr and optional port from addr (ipv6 or mac) in forms
     * 'fe80::b908:c314:cfbd:7a4a 11200' -> ['fe80::b908:c314:cfbd:7a4a', '11200']
     * 'fe80::b908:c314:cfbd:7a4a' -> ['fe80::b908:c314:cfbd:7a4a']
     * 'f8:34:41:91:33:36' -> ['fe80::b908:c314:cfbd:7a4a']
  */
  getHostAndPort(addr) {
    if(addr.match(/ /)) return addr.split(' ')
    if(addr.length == 17) return [ipv6LocalFromMac(addr)]
    if(addr.length == 25) return [addr]
    throw Error('wrong length, cannot handle')
  },
  /**
    Discover omegas on intferface with ipv6 and check with
    definitions in config
  */
  async discover(c) {
    var {stdout, stderr} = await exec(`ping6 -c${c} ff02::1%${config.getConfig().default.interface}`)
    let foundIps = new Set()
    let times = {}
    var r = /bytes from (.*?) .*? time=(.*?) ms/gm
    var m = r.exec(stdout)
    while(m) {
      let ip = m[1].slice(0, -1)
      if(!times[ip]) times[ip] = []
      times[ip].push(parseFloat(m[2]))
      foundIps.add(ip)
      m = r.exec(stdout)
    }
    let found = [...foundIps]
    let defined = config.getIps()
    times = _.mapValues(times, _.flow([_.mean, _.partialRight(_.round, 4)]))
    return { found, defined, times, complete: _.intersection(found, defined).length === defined.length}
  },
  /**
    Flash image to omages with previously testing if sv status lethd reacts
  */
  flash(image) {
    _.each(config.getIps(), ip => flash(ip, config.getConfig().default.interface, image).catch(err => {
      log.warn(`${ip}: something went wrong: ${err}`);
    }))
  },
  /**
    Copy executable lethd to omages with stopping and starting service
  */
  copy(lethd) {
    _.each(config.getIps(), ip => copy(ip, config.getConfig().default.interface, lethd).catch(err => {
      log.warn(`${ip}: something went wrong: ${err}`);
    }))
  },
  /**
    Distributes uci settings to device, settings are a=b,c=d, ...
  */
  uci(settings, cmd) {
    _.each(config.getIps(), ip => uci(ip, config.getConfig().default.interface, settings, cmd).catch(err => {
      log.warn(`${ip}: something went wrong: ${err}`);
    }))
  }
}
