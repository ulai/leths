const config = require('./config.js'),
      log = require('./logger').getLogger('webserver'),
      express = require('express'),
      app = express(),
      server = require('http').createServer(app),
      io = require('socket.io').listen(server),
      spawn = require('child_process').spawn,
      _ = require('lodash'),
      EventEmitter = require('events')

/** @module WebServer */

/**
  Webserver
  websocket.io and static serving
*/

class WebServer extends EventEmitter {
  /**
    @param clients - list of clients {text: [{Client}], light: [], neuron: []}
    @param {Integer} port - tcp port to listen
  */
  constructor(clients, port) {
    super()
    server.listen(port)

    app.use('/', express.static('web'))

    app.get('/', (req, res) => {
    	res.sendFile(__dirname + '/web/index.html')
    })

    log.info(`server runs at http://127.0.0.1:${port}/`)

    setInterval(() => {
      io.sockets.emit('stats', {
        clients: _.mapValues(clients, x => _.map(x, y => ({ online: y.online, device: y.device }))),
        online: _.filter(_.flatten(_.values(clients)), c => c.online).length,
        total: _.flatten(_.values(clients)).length,
      })
    }, 1e3)

    _.each(['ledchain1', 'ledchain2'], ledchain => {
      spawn('tail', ['-f', `/tmp/${ledchain}`]).stdout.on('data', data => {
        io.sockets.emit(ledchain, data)
      })
    })

    io.sockets.on('connection', socket => {
      log.info(`websocket connected`);
    	socket.on('set', x => {
        log.info('set %j', x)
        let o = {feature: 'text'}
        o[x.k] = x.v
        _.each(clients.text, c => c.send(o));
    	})
      socket.on('startScroll', x => {
        log.info('startScroll %j', x)
        let o = { feature: 'text', cmd: 'startscroll', start: (new Date).getTime() + 200 }
        o = _.merge(o, _.omitBy(x, _.isNull))
        _.each(clients.text, c => c.send(o))
    	})
      socket.on('stopScroll', () => {
        log.info('stopScroll')
        _.each(clients.text, c => c.send({feature: 'text', cmd: 'startscroll', steps: 0, start: (new Date).getTime() + 200}))
      })
      socket.on('fade', x => {
        log.info('fade %j', x)
        let o = {feature: 'text', cmd: 'fade'}
        if(x.to!==undefined) o.to = x.to
        if(x.t!==undefined) o.t = x.t
        _.each(clients.text, c => c.send(o))
      })
      socket.on('textJson', x => {
        log.info('textJson %j', x)
        let o = {feature: 'text'}
        o = _.merge(o, x)
        _.each(clients.text, c => c.send(o))
      })
      socket.on('fire', i => {
        log.info('fire %d', i)
        clients.neuron[i].send({feature: 'neuron', cmd: 'fire'});
      })
      socket.on('light', x => {
        log.info('light %j', x)
        this.emit('light', x)
      })
      socket.on('text', x => {
        log.info('text %j', x)
        this.emit('text', x)
      })
      socket.on('textdefault', () => {
        log.info('textdefault')
        this.emit('text', {textdefault:1})
      })
    })
  }

  light(v, pos) {
    log.debug('%d %j', v, pos)
    io.sockets.emit('light', {v, pos})
  }
}

module.exports = WebServer
