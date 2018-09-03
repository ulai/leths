module.exports = {
  getWebServerPort: () => 3333,  // Webserver listens on this port
  getTimeout: () => 3e3,         // timeout to receive an answer (ms)
  getStartWatchdog: () => 7e3,   // start watchdog this time after connection (ms)
  getRepeatWatchdog: () => 15e3,  // repeat watchdog every (ms)
}
