module.exports = {
  getWebServerPort: () => 3333,  // Webserver listens on this port
  getTimeout: () => 1e3,         // timout to receive an answer (ms)
  getStartWatchdog: () => 1e3,   // start watchdog this time after connection (ms)
  getRepeatWatchdog: () => 5e3,  // repeat watchdog every (ms)
}
