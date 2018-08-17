"use strict"

angular
.module('app', [])
.controller('ctrl', ['$scope', '$interval', '$timeout', ($scope, $interval, $timeout) => {
  var socket = io.connect()

  socket.on('stats', (stats) => $scope.$apply(() => $scope.stats = stats))
  $scope.setText = (text) => socket.emit('setText', text)
  $scope.startScroll = () => socket.emit('startScroll')
  $scope.stopScroll = () => socket.emit('stopScroll')

  const N = 100
  $scope.ledchains = {}
  _.each(['ledchain1', 'ledchain2'], ledchain => {
    $scope.ledchains[ledchain] = _.times(N, () => `rgb(0,0,0)`)
    let buffer = new Uint8Array()
    socket.on(ledchain, (leds) => $scope.$apply(() => {
      buffer = new Uint8Array([...buffer, ...(new Uint8Array(leds))])
      if(buffer.lenght < N * 3) return
      console.log(_.findIndex(new Uint8Array(buffer), x => x === 255))
      $scope.ledchains[ledchain] = _.map(_.chunk(new Uint8Array(buffer), 3), x => {
        return `rgb(${x[0]},${x[1]},${x[2]})`
      })
      buffer = new Uint8Array()
    }))
  })

  //$scope.modules = _.times(35, () => `rgb(0,0,0)`)
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
}])
