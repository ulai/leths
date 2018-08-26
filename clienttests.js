"use strict"

const chai = require('chai'),
      expect = chai.expect,
      sinon = require('sinon'),
      net = require('net'),
      utils = require('./utils'),
      config = require('./config'),
      settings = require('./settings'),
      Client = require('./client')

describe('client', () => {
  describe('connection', function() {
    var server, socket
    before(() => {
      sinon.stub(utils, 'getHostAndPort').callsFake(() => ['localhost', 12345] )
      sinon.stub(config, 'getConfig').callsFake(() => { return { default: {interface: ''}} } )
      sinon.stub(settings, 'getTimeout').callsFake(() => 100)
      sinon.stub(settings, 'getStartWatchdog').callsFake(() => 10)
      sinon.stub(settings, 'getRepeatWatchdog').callsFake(() => 200)
    })
    beforeEach(() => {
      server = net.createServer(_socket => {
        socket = _socket
      }).listen(12345)
    }),
    it('connects', function(done) {
      const device = {addr: '1', text:[{}]}
      var client = new Client(device, {}, {'text': device.text}, () => {
        socket.once('data', d => done())
      })
    })
    it('reconnects', function(done) {
      const device = {addr: '2', text:[{}]}
      var client = new Client(device, {}, {'text': device.text}, () => {
        //socket.once('end', () => done())
        done()
      })
    })
    afterEach(() => {
      server.close()
      socket.removeAllListeners()
    })
    after(() => {
      utils.getHostAndPort.reset()
      config.getConfig.reset()
      settings.getTimeout.reset()
      settings.getStartWatchdog.reset()
      settings.getRepeatWatchdog.reset()
    })
  })
})
