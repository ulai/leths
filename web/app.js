"use strict"

angular
.module('app', ['ui.router'])
.factory('websocket', () => {
  const socket = io.connect()
  return socket
})
//remove leading '#' from color
.filter('rgb', () => { return function(x) { return x.substr(1) } })
.config(['$stateProvider', '$urlRouterProvider', ($stateProvider, $urlRouterProvider) => {
  $urlRouterProvider.otherwise('/');
  $stateProvider.state('index', {
    url: '/',
    templateUrl: 'tmpl/index.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.color = function(c, r) {
        return $scope.grid[c+r]===undefined ? '#BBB' : (_.every($scope.grid[c+r], 'online') ? 'green' : 'red');
      };
      //websocket.on('stats', stats => $scope.$apply(() => $scope.stats = stats))
    }]
  })
  $stateProvider.state('text', {
    url: '/text',
    templateUrl: 'tmpl/text.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.set = (k,v) => websocket.emit('set', {k, v})
      $scope.startScroll = (stepx, stepy, steps, interval, roundoffsets, start) => websocket.emit('startScroll', {stepx, stepy, steps, interval, roundoffsets, start})
      $scope.stopScroll = () => websocket.emit('stopScroll')
      $scope.fade = (to, t) => websocket.emit('fade', {to, t})
    }]
  })
  $stateProvider.state('list', {
    url: '/list',
    templateUrl: 'tmpl/list.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
    }]
  })
  $stateProvider.state('test', {
    url: '/test',
    templateUrl: 'tmpl/test.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.fire = i => websocket.emit('fire', i)
      $scope.tetris = b => websocket.emit('light', {tetris: b})
      $scope.test = b => websocket.emit('light', {test: b})
      $scope.noise = b => websocket.emit('light', {noise: b})
      $scope.wave = b => websocket.emit('light', {wave: b})
      $scope.clear = b => websocket.emit('light', {clear: 1})
      $scope.modules = _.times(35, x => {
        return `rgb(255,255,255)`
      })
      websocket.on('light', l =>
        $scope.$apply(() => $scope.modules[l.pos.x + l.pos.y * 5] = `rgb(${l.v*255},${l.v*255},${l.v*255})`))
    }]
  })
  $stateProvider.state('sim', {
    url: '/sim',
    templateUrl: 'tmpl/sim.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.fire = i => websocket.emit('fire', i)
      $scope.tetris = b => websocket.emit('light', {tetris: b})
      $scope.test = b => websocket.emit('light', {test: b})
      $scope.clear = b => websocket.emit('light', {clear: 1})

      const N = 100
      $scope.ledchains = {}
      _.each(['ledchain1', 'ledchain2'], ledchain => {
        $scope.ledchains[ledchain] = _.times(N, () => `rgb(0,0,0)`)
        let buffer = new Uint8Array()
        websocket.on(ledchain, (leds) => $scope.$apply(() => {
          buffer = new Uint8Array([...buffer, ...(new Uint8Array(leds))])
          if(buffer.lenght < N * 3) return
          $scope.ledchains[ledchain] = _.map(_.chunk(new Uint8Array(buffer), 3), x => {
            return `rgb(${x[0]},${x[1]},${x[2]})`
          })
          buffer = new Uint8Array()
        }))
      })

    }]
  })
}])
.controller('ctrl', ['$scope', '$interval', '$timeout', 'websocket', function($scope, $interval, $timeout, websocket) {
  websocket.on('stats', stats => $scope.$apply(() => {
    $scope.stats = stats
    $scope.grid = _.groupBy(_.flatten(_.values($scope.stats.clients)), 'device.gridcoordinate')
  }))
}])
