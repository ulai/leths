"use strict"

angular
.module('app', [])
.controller('ctrl', ['$scope', '$interval', '$timeout', ($scope, $interval, $timeout) => {
  var socket = io.connect()

  socket.on('stats', stats => $scope.$apply(() => $scope.stats = stats))

  $scope.set = (k,v) => socket.emit('set', {k, v})
  $scope.startScroll = (stepx, stepy, steps, interval, roundoffsets, start) => socket.emit('startScroll', {stepx, stepy, steps, interval, roundoffsets, start})
  $scope.stopScroll = () => socket.emit('stopScroll')
  $scope.fade = (to, t) => socket.emit('fade', {to, t})
  $scope.fire = i => socket.emit('fire', i)

  const N = 100
  $scope.ledchains = {}
  _.each(['ledchain1', 'ledchain2'], ledchain => {
    $scope.ledchains[ledchain] = _.times(N, () => `rgb(0,0,0)`)
    let buffer = new Uint8Array()
    socket.on(ledchain, (leds) => $scope.$apply(() => {
      buffer = new Uint8Array([...buffer, ...(new Uint8Array(leds))])
      if(buffer.lenght < N * 3) return
      $scope.ledchains[ledchain] = _.map(_.chunk(new Uint8Array(buffer), 3), x => {
        return `rgb(${x[0]},${x[1]},${x[2]})`
      })
      buffer = new Uint8Array()
    }))
  })

  function noise() {
    $interval(() => {
      $scope.modules = _.map($scope.modules, x => {
        let c = _.random(0, 255)
        return `rgb(${c},${c},${c})`
      })
    }, 10)
  }
  function chess() {
    $scope.modules = _.times(35, x => {
      let c = x % 2 ? 255 : 0
      return `rgb(${c},${c},${c})`
    })
  }
  chess()
  socket.on('light', l =>
    $scope.$apply(() => $scope.modules[l.pos.x + l.pos.y * 5] = `rgb(${l.v*255},${l.v*255},${l.v*255})`))
}])
