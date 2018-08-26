#!/usr/bin/env node
const program = require('commander'),
      utils = require('./utils'),
      winston = require('winston'),
      log = require('./logger').getLogger('cli'),
      config = require('./config')

require('./logger').toConsole()

program
  .command('discover <c>')
  .description('Discover Ω(s)')
  .action(c =>  utils.discover(c, x => {
    log.info('%j', x)
  }))
program
  .command('config')
  .description('Check config')
  .action(() => config.check())
program
  .command('flash <image>')
  .description('Flash firmware from image')
  .action(image => utils.flash(image))
program
  .command('copy <lethd>')
  .description('Copy lethd binary')
  .action(lethd => utils.copy(lethd))

program.on('command:*', function () {
  program.help()
  process.exit(1)
})

program.parse(process.argv)
