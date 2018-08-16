const config = require('./config.js'),
      log = require('./logger').getLogger(),
      express = require('express'),
      app = express(),
      server = require('http').createServer(app),
      io = require('socket.io').listen(server),
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

    app.get('/test', (req, res) => {
      res.send(`unixtime: ${+ new Date()}`)
    })

    log.info(`server runs at http://127.0.0.1:${port}/`)

    setInterval(() => {
      io.sockets.emit('stats', {
        online: _.filter(_.flatten(_.values(clients)), (c) => c.online).length,
      })
    }, 1e3)

    io.sockets.on('connection', (socket) => {
      log.info(`websocket connected`);
    	socket.on('setText', (text) => {
        log.info(`setText: ${text}`)
        //start in 100ms
        var start = (new Date).getTime() + 100;
        _.each(clients.text, (c) => c.send({
          cmd: 'setText', text, start
        }));
    	})
    })
  }
}

module.exports = WebServer
