const config = require('./config.js'),
      log = require('./logger').getLogger('webserver'),
      express = require('express'),
      app = express(),
      server = require('http').createServer(app),
      io = require('socket.io').listen(server),
      spawn = require('child_process').spawn,
      _ = require('lodash')

/** @module WebServer */

/**
  Webserver
  websocket.io and static serving
*/

class WebServer {
  /**
    @param clients - list of clients {text: [{Client}], light: [], neuron: []}
    @param {Integer} port - tcp port to listen
  */
  constructor(clients, port) {
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
    	socket.on('setText', text => {
        log.info('setText %s', text)
        _.each(clients.text, c => c.send({feature: 'text', text: text || ''}));
    	})
      socket.on('startScroll', () => {
        log.info('startScroll')
        var start = (new Date).getTime() + 50;
        _.each(clients.text, c => c.send({feature: 'text', cmd: 'startscroll', start: start}));
    	})
      socket.on('stopScroll', () => {
        log.info('stopScroll')
        _.each(clients.text, c => c.send({feature: 'text', cmd: 'stopscroll'}));
      })
      socket.on('fire', i => {
        log.info('fire %d', i)
        clients.neuron[i].send({feature: 'neuron', cmd: 'fire'});
      })
    })
  }
}

module.exports = WebServer
