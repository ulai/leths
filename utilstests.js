process.env.NODE_ENV === 'test'

const chai = require('chai'),
      expect = chai.expect,
      sinon = require('sinon'),
      log = require('./logger'),
      spawn = require('mock-spawn')()

require('child_process').spawn = spawn
const utils = require('./utils'),
      config = require('./config')

describe('utility functions', () => {
  describe('getHostAndPort', () => {
    it('ipv6 and port', () => {
      expect(utils.getHostAndPort('fe80::b908:c314:cfbd:7a4a 11200')).to.deep.equal(['fe80::b908:c314:cfbd:7a4a', '11200'])
    })
    it('ipv6 only', () => {
      expect(utils.getHostAndPort('fe80::42a3:6bff:fec1:88e6')).to.deep.equal(['fe80::42a3:6bff:fec1:88e6'])
    })
    it('mac only', () => {
      expect(utils.getHostAndPort('40:a3:6b:c1:88:e6')).to.deep.equal(['fe80::42a3:6bff:fec1:88e6'])
    })
    it('wrong length', () => {
      expect(utils.getHostAndPort.bind(utils, '40:a3:6:c:88:e6')).to.throw('wrong length, cannot handle')
    })
  })
  describe('discover', () => {
    before(() => {
      sinon.stub(config, 'getIps').callsFake(() => ['fe80::b908:c314:cfbd:7a4a', 'fe80::20d:b9ff:fe4d:5d10', 'fe80::e695:6eff:fe41:84e8'])
      sinon.stub(config, 'getConfig').callsFake(() => { return { default: {interface: 'eth0'}}})
    }),
    it('finds omegas', (done) => {
      spawn.sequence.add(function (cb) {
        this.stdout.write('64 bytes from fe80::b908:c314:cfbd:7a4a: icmp_seq=1 ttl=64 time=0.011 ms')
        this.stdout.write('64 bytes from fe80::20d:b9ff:fe4d:5d10: icmp_seq=1 ttl=64 time=0.305 ms (DUP!)')
        this.stdout.write('64 bytes from fe80::e695:6eff:fe41:84e8: icmp_seq=1 ttl=64 time=0.589 ms (DUP!)')
        this.stdout.write('64 bytes from fe80::b908:c314:cfbd:7a4a: icmp_seq=2 ttl=64 time=0.033 ms')
        this.stdout.write('64 bytes from fe80::20d:b9ff:fe4d:5d10: icmp_seq=2 ttl=64 time=0.235 ms (DUP!)')
        cb()
      })
      utils.discover(10, ips => {
        expect(ips.found).to.deep.equal(['fe80::b908:c314:cfbd:7a4a', 'fe80::20d:b9ff:fe4d:5d10', 'fe80::e695:6eff:fe41:84e8'])
        expect(ips.times).to.deep.equal({'fe80::b908:c314:cfbd:7a4a' : 0.022, 'fe80::20d:b9ff:fe4d:5d10' : 0.27, 'fe80::e695:6eff:fe41:84e8' : 0.589 })
        expect(ips.complete).to.equal(true)
        done()
      })
    })
    it('missing some omegas', (done) => {
      spawn.sequence.add(function (cb) {
        this.stdout.write('64 bytes from fe80::b908:c314:cfbd:7a4a: icmp_seq=1 ttl=64 time=0.024 ms')
        this.stdout.write('64 bytes from fe80::20d:b9ff:fe4d:5d10: icmp_seq=1 ttl=64 time=0.305 ms (DUP!)')
        cb()
      })
      utils.discover(10, ips => {
        expect(ips.found).to.deep.equal(['fe80::b908:c314:cfbd:7a4a', 'fe80::20d:b9ff:fe4d:5d10'])
        expect(ips.defined).to.deep.equal(['fe80::b908:c314:cfbd:7a4a', 'fe80::20d:b9ff:fe4d:5d10', 'fe80::e695:6eff:fe41:84e8'])
        expect(ips.complete).to.equal(false)
        done()
      })
    })
    after(() => {
      config.getIps.reset()
      config.getConfig.reset()
    })
  })
})
