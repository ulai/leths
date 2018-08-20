#!/usr/bin/env node
const program = require('commander'),
      config = require('./config'),
      utils = require('./utils'),
      winston = require('winston'),
      log = require('./logger').getLogger('cli')

require('./logger').toConsole()

program
  .command('discover <iface>')
  .description('Discover Ω(s)')
  .action(iface =>  utils.discover(iface))
program
  .command('config')
  .description('Check config')
  .action(() => config.check())
program
  .command('flash <image>')
  .description('Flash firmware from image')
  .action(image => {
    log.info(`flash image ${image}`)
    utils.flash(image)
  })
program
  .command('dist <lethd>')
  .description('Distribute lethd binary')
  .action(lethd => {
    console.log(`dist binary ${lethd}`)
  })

program.on('command:*', function () {
  program.help()
  process.exit(1)
})

program.parse(process.argv)
