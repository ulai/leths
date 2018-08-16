"use strict"

angular
.module('app', [])
.controller('ctrl', ['$scope', ($scope) => {
  $scope.text = 'Hello world!'
  var socket = io.connect()
  socket.on('stats', (stats) => $scope.$apply(() => $scope.stats = stats))
  $scope.setText = (text) => socket.emit('setText', text)
}])
