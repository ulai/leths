process.env.NODE_ENV = 'test'

const chai = require('chai'),
      expect = chai.expect,
      sinon = require('sinon'),
      spawn = require('child_process').spawn,
      exec = require('child_process').exec,
      log = require('./logger'),
      config = require('./config'),
      blockrain = require('./blockrain')

const lethd = './lethdx86'
var leths

describe('features', function() {
  this.timeout(2e3)
  before(() => {
    sinon.stub(config, 'getConfig').callsFake(() => {
      return { default: { interface: 2, port: 12340 },
              omegas: { text: [ { addr: "::1 12340", text: [{cols: 22, offset: 123, orentiation: 1}] }],
                        light: {size: {x: 1, y: 1},
                          lights: [{ addr: '::1 12341' }]},
                        neuron: {movingAverageCount: 20, threshold: 250, numBodyLeds: 70,
                          neurons: [{addr: '::1 12342', x: 1, y : 3, numAxonLeds: 70}]}} }
    })
    sinon.stub(blockrain, 'game').callsFake(() => {
      return { create: () => {}, pause: () => {}, resume: () => {}}
    })
    leths = require('./leths')
  }),
  describe('text', function() {
    it('initializes', done => {
      exec('>/tmp/ledchain1')
      var p = spawn(lethd, ['--ledchain1', '/tmp/ledchain1', '--lethdapiport', 12340])
      var lines = []
      p.stdout.on('data', data => {
         lines.push(data.toString())
         if(data.toString().match(/initializing/)) {
           expect(lines.some(x => x.includes('lethd initialize()'))).to.be.true
           expect(lines.some(x => x.includes('initializing dispmatrix'))).to.be.true
           p.kill()
           done()
         }
      })
    })
    it('writes text')
    it('changes color')
  })
  describe('light', () => {
    it('initializes', done => {
      exec('echo "123">/tmp/ledchain1')
      var p = spawn(lethd, ['--lethdapiport', 12341, '--pwmdimmer', 'fdsim./tmp/pwmpin'])
      var lines = []
      p.stdout.on('data', data => {
         lines.push(data.toString())
         if(data.toString().match(/initializing/)) {
           expect(lines.some(x => x.includes('lethd initialize()'))).to.be.true
           expect(lines.some(x => x.includes('initializing fader'))).to.be.true
           p.kill()
           done()
         }
      })
    })
    it('fades')
  })
  describe('neuron', () => {
    it('initializes')
    it('spikes')
  })
  after(() => {
    config.getConfig.restore()
    blockrain.game.restore()
  })
})
