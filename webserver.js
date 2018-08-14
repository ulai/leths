const config = require('./config.js'),
      log = require('./logger').getLogger(),
      express = require('express'),
      app = express(),
      server = require('http').createServer(app),
      _ = require('lodash')

class WebServer {
  constructor(port) {
    server.listen(port)

    app.use('/', express.static('web'))

    app.get('/', (req, res) => {
    	res.sendFile(__dirname + '/index.html')
    })

    app.get('/test', (req, res) => {
      res.send(`unixtime: ${+ new Date()}`)
    })

    log.info(`server runs at http://127.0.0.1:${port}/`)
  }

}

module.exports = WebServer
