const _ = require('lodash'),
      spawn = require('child_process').spawn,
      config = require('./config'),
      log = require('./logger').getLogger('utils'),
      async = require('async')

function ipv6LocalFromMac(mac) {
  m = mac.split(':')
  m[0] = (parseInt(m[0], 16) ^ 0x02).toString(16)
  return `fe80::${m[0]}${m[1]}:${m[2]}ff:fe${m[3]}:${m[4]}${m[5]}`
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
    throw 'wrong length, cannot handle'
  },
  /**
    Discover omegas on intferface with ipv6 and check with
    definitions in config
  */
  discover(iface, n, cb) {
    const ping = spawn('ping6', [`-c${n}`, `ff02::1%${iface}`])
    let foundIps = new Set()
    let times = {}
    ping.stdout.on('data', data => {
      data = data.toString()
      let m =  data.match(`bytes from (.*?) .*? time=(.*?) `)
      if(m) {
        let ip = m[1].slice(0, -1)
        if(!times[ip]) times[ip] = []
        times[ip].push(parseFloat(m[2]))
        foundIps.add(ip)
      }
    })
    ping.stderr.on('data', data => { throw new Error(data.toString()) })
    ping.on('error', error => { throw new Error(error.toString()) })
    ping.on('exit', code => {
      let found = [...foundIps]
      let defined = config.getIps()
      times = _.mapValues(times, _.mean)
      cb({ found, defined, times, complete: _.intersection(found, defined).length === defined.length})
    })
  },
  /**
    Flash image to omages
  */
  flash(image) {
    let ips = ['172.17.0.2', '172.17.0.3', '172.17.0.4']
    spawn('ssh', ['-i', '~/.ssh/leth-maint-ecdsa256', '-o', 'StrictHostKeyChecking=no', `root@${ip}`, 'sv stop lethd'])
      .stdout.on('data', data => {
      data = data.toString()
      log.info(data)
    })
  }
}
