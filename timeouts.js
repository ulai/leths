const timeouts = {}

module.exports = {
  add: (id, cb, t) => {
    if(id in timeouts) clearTimeout(timeouts[id])
    timeouts[id] = setTimeout(() => {
      cb()
      delete(timeouts[id])
    }, t)
  }
}
