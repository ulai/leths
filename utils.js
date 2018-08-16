const _ = require('lodash')

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
}