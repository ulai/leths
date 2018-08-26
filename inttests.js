process.env.NODE_ENV = 'test'

const chai = require('chai'),
      expect = chai.expect,
      sinon = require('sinon'),
      spawn = require('child_process').spawn,
      log = require('./logger'),
      leths = require('./leths')

const lethd = './lethdx86'

describe('features', () => {
  describe('text', () => {
    before(() => {
      // sinon.stub(config, 'getConfig').callsFake(() => {
      //   return { "default": { "interface": "wlp3s0", "port": 55555 },
      //           "omegas": { "text": [ { "addr": "fe80::2929:196e:f9ae:2292 11200", "text": [{"cols": 22, "offset": 123, "orentiation": 1}] }]}}
      // })
    }),
    it('initializes', done => {
      var p = spawn(lethd, ['--ledchain1', '/tmp/ledchain1'])
        .stdout.on('data', data => {
            expect(data.toString()).to.have.string('lethd initialize()')
            console.log(p);
            done()
      })
    })
    it('writes text')
    it('changes color')
    after(() => {
      // config.getConfig.reset()
    })
  })
  describe('light', () => {
    it('initializes')
    it('fades')
  })
  describe('neuron', () => {
    it('initializes')
    it('spikes')
  })
})
