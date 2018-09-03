"use strict";

angular
.module('app', ['ui.router'])
.factory('websocket', function() {
  var socket = io.connect();
  return socket;
})
//remove leading '#' from color
.filter('rgb', function() { return function(x) { return x.substr(1); } })
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
  $stateProvider.state('index', {
    url: '/',
    templateUrl: 'tmpl/index.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      websocket.on('stats', function(stats) { $scope.$apply(function() $scope.stats = stats); });
    }]
  });
  $stateProvider.state('text', {
    url: '/text',
    templateUrl: 'tmpl/text.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.set = function(k,v) { websocket.emit('set', {k, v}) };
      $scope.startScroll = function(stepx, stepy, steps, interval, roundoffsets, start) {
        websocket.emit('startScroll', {stepx, stepy, steps, interval, roundoffsets, start});
      });
      $scope.stopScroll = function() { websocket.emit('stopScroll') };
      $scope.fade = function(to, t) { websocket.emit('fade', {to, t}) };
    }]
  });
  $stateProvider.state('list', {
    url: '/list',
    templateUrl: 'tmpl/list.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
    }]
  });
  $stateProvider.state('test', {
    url: '/test',
    templateUrl: 'tmpl/test.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.fire = function(i) { websocket.emit('fire', i) };
      $scope.tetris = function(b) { websocket.emit('light', {tetris: b}) };
      $scope.test = function(b) { websocket.emit('light', {test: b}) };
      $scope.noise = function(b) { websocket.emit('light', {noise: b}) };
      $scope.wave = function(b) { websocket.emit('light', {wave: b}) };
      $scope.clear = function(b) { websocket.emit('light', {clear: 1}) };
      $scope.modules = _.times(35, function(x) {
        return 'rgb(255,255,255)';
      })
      websocket.on('light', function(l) {
        $scope.$apply(function() {$scope.modules[l.pos.x + l.pos.y * 5] = `rgb(${l.v*255},${l.v*255},${l.v*255})`} )
      })
    }]
  })
  $stateProvider.state('sim', {
    url: '/sim',
    templateUrl: 'tmpl/sim.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.fire = function(i) { websocket.emit('fire', i) }
      $scope.tetris = function(b) { websocket.emit('light', {tetris: b}) }
      $scope.test = function(b) { websocket.emit('light', {test: b}) }
      $scope.clear = function(b) { websocket.emit('light', {clear: 1}) }

      var N = 100
      $scope.ledchains = {}
      _.each(['ledchain1', 'ledchain2'], function(ledchain) {
        $scope.ledchains[ledchain] = _.times(N, function() { `rgb(0,0,0)` })
        var buffer = new Uint8Array()
        websocket.on(ledchain, function(leds) {
            $scope.$apply(function() {
              buffer = new Uint8Array([...buffer, ...(new Uint8Array(leds))])
              if(buffer.lenght < N * 3) return
              $scope.ledchains[ledchain] = _.map(_.chunk(new Uint8Array(buffer), 3), function(x) {
                return `rgb(${x[0]},${x[1]},${x[2]})`
              })
              buffer = new Uint8Array()
        })})
      })
    }]
  })
}])
.controller('ctrl', ['$scope', '$interval', '$timeout', 'websocket', function($scope, $interval, $timeout, websocket) {
  websocket.on('stats', function(stats) { $scope.$apply(function() { $scope.stats = stats }) })
}])
