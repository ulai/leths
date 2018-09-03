"use strict";

angular
.module('app', ['ui.router'])
.factory('websocket', function() {
  var socket = io.connect();
  return socket;
})
.filter('rgb', function() { return function(x) { return x.substr(1); } })
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
  $stateProvider.state('index', {
    url: '/',
    templateUrl: 'tmpl/index.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      websocket.on('stats', function(stats) { $scope.$apply(function() {$scope.stats = stats; }); });
    }]
  });
  $stateProvider.state('text', {
    url: '/text',
    templateUrl: 'tmpl/text.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {
      $scope.set = function(k,v) { websocket.emit('set', {k, v}) };
      $scope.startScroll = function(stepx, stepy, steps, interval, roundoffsets, start) {
        websocket.emit('startScroll', {stepx, stepy, steps, interval, roundoffsets, start});
      };
      $scope.stopScroll = function() { websocket.emit('stopScroll') };
      $scope.fade = function(to, t) { websocket.emit('fade', {to, t}) };
    }]
  });
  $stateProvider.state('list', {
    url: '/list',
    templateUrl: 'tmpl/list.html',
    controller: ['$scope', 'websocket', function($scope, websocket) {} ]
  });
}])
.controller('ctrl', ['$scope', '$interval', '$timeout', 'websocket', function($scope, $interval, $timeout, websocket) {
  websocket.on('stats', function(stats) { $scope.$apply(function() { $scope.stats = stats }) })
}])
