"use strict"

const chai = require('chai'),
      expect = chai.expect,
      sinon = require('sinon'),
      net = require('net'),
      _ = require('lodash'),
      utils = require('./utils'),
      config = require('./config'),
      settings = require('./settings'),
      Client = require('./client')

describe('client', function() {
  describe('connection', function() {
    var server, socket
    before(() => {
      sinon.stub(utils, 'getHostAndPort').callsFake(() => ['localhost', 12345] )
      sinon.stub(config, 'getConfig').callsFake(() => { return { default: {interface: ''}} } )
      sinon.stub(settings, 'getTimeout').callsFake(() => 1)
      sinon.stub(settings, 'getStartWatchdog').callsFake(() => 1)
      sinon.stub(settings, 'getRepeatWatchdog').callsFake(() => 1)
    })
    beforeEach(function() {
      server = net.createServer(_socket => {
        socket = _socket
      }).listen(12345)
    }),
    it('inits', function(done) {
      const device = {addr: '1', text:[{}]}
      var client = new Client(device, {}, {'text': device.text})
      setTimeout(() => {
        var cmds = []
        socket.on('data', d => {
          _.merge(cmds, d.toString().split('\n').filter(Boolean))
          if(cmds.length > 1) {
            console.dir(cmds);
            expect(cmds).to.include('{"cmd":"init","text":[{}]}')
            expect(cmds).to.include('{"cmd":"status"}')
            done()
          }
        })
      }, 10)
    })
    it('reconnects', function(done) {
      const device = {addr: '2', text:[{}]}
      var client = new Client(device, {}, {'text': device.text})
      setTimeout(() => {
        expect(client.online).to.equal(false)
        done()
      }, 10)
    })
    afterEach(function() {
      server.close()
      socket.removeAllListeners()
    })
    after(function() {
      utils.getHostAndPort.restore()
      config.getConfig.restore()
      settings.getTimeout.restore()
      settings.getStartWatchdog.restore()
      settings.getRepeatWatchdog.restore()
    })
  })
})
