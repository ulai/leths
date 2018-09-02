const chai = require('chai'),
      expect = chai.expect,
      sinon = require('sinon'),
      utils = require('./utils')

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
})
