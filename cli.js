#!/usr/bin/env node
const program = require('commander'),
      winston = require('winston'),
      _ = require('lodash'),
      utils = require('./utils'),
      log = require('./logger').getLogger('cli'),
      config = require('./config')

require('./logger').toConsole()

program
  .command('discover <c>')
  .description('Discover Ω(s)')
  .action(c =>  utils.discover(c).then(stat => {
    _.forOwn(stat.times, (v, k) => log.info(`${k} avg:${v}ms`))
    if(!stat.complete) log.warn('Not all omegas found')
  }))
program
  .command('config')
  .description('Check config')
  .action(() => config.check())
program
  .command('flash <image>')
  .description('Flash firmware from image')
  .action(utils.flash)
program
  .command('copy <lethd>')
  .description('Copy lethd binary')
  .action(utils.copy)
program
  .command('shellcmd "<shell command>"')
  .description('run shell command on each controller')
  .action(utils.shellcmd)
program
  .command('uci <settings> <cmd>')
  .description('Distribute uci settings: (a=b,c=d) cmd: executed afterwards')
  .action(utils.uci)

program.on('command:*', function () {
  program.help()
  process.exit(1)
})

program.parse(process.argv)
