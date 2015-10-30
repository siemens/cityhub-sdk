/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

angular.module('chSensorsApp')
  .controller('NavbarCtrl', function($scope, $location, socket) {

    $scope.isConnected = socket.isConnected();

    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    },
    {
      'title': 'REST',
      'link': '/rest'
    },
    {
      'title': 'MQTT',
      'link': '/mqtt'
    }];

    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    ///////////////////
    // register SocketIO connection callback
    //var isFirstConnect = true;
    var socketSyncConnectCb = function(event) {
      //console.log('Navbar socket.socketSyncConnectCb cb(%s) %o', event, socket);
      if (event === 'connect') {
        $scope.isConnected = true;
      } else if (event === 'disconnect') {
        $scope.isConnected = false;
      }
    };
    socket.syncConnection(socketSyncConnectCb);

    function destroy() {
      socket.unsyncConnection(socketSyncConnectCb);
    }

    $scope.$on('$destroy', function() {
      destroy();
    });

  });
