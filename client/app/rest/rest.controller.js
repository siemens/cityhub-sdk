/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

angular.module('chSensorsApp')
  .controller('RestCtrl', function($scope, $http, notify) {

    // populate sample REST API requests
    var now = new Date();
    var timestampNow = now.toISOString();
    $scope.apis = [
      {httpMethod: 'GET', path: '/api/devices', description: 'Returns a list of the available city hub devices and their sensors',
        sampleRequest: {path: '/api/devices'}},
      {httpMethod: 'GET', path: '/api/devices/reset', description: 'Resets the city hub devices to their default configuration',
        sampleRequest: {path: '/api/devices/reset'}},
      {separator: true},

      {httpMethod: 'GET', path: '/api/devices/:deviceId', description: 'Returns the specified city hub device',
        sampleRequest: {path: '/api/devices/ch1'}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId', description: 'Sets configuration of the specified city hub device',
        sampleRequest: {path: '/api/devices/ch1', body: {id: 'ch1', info: 'city hub 1', latitude: 36.165036, longitude: -86.7840599, sensors: [
          {id: 'AvailableParkingSpaces', index: 1, info: 'Number of available parking spaces in the area, 0-500', type: 'integer', isBookable: true, pricePerHour: 1, minValue: 0, maxValue: 500, value: 5, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'AvailableBikes', index: 2, info: 'Number of available bikes for rent in the area, 0-20', type: 'integer', isBookable: true, pricePerHour: 5, minValue: 0, maxValue: 20, value: 10, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'Temperature', index: 3, info: 'Temperature sensor, -150 - +150 Celsius/Fahrenheit', type: 'float', minValue: -150.0, maxValue: 150.0, value: 20.0, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'Humidity', index: 4, info: 'Atmospheric relative humidity sensor, 10 - 95% RH', type: 'float', minValue: 10.0, maxValue: 95.0, value: 40.0, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'UVB', index: 5, info: 'Ultraviolet light sensor that responds primarily to UVB radiation, 290-320 nm', type: 'float', minValue: 290.0, maxValue: 320.0, value: 300.0, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'AmbientNoise', index: 6, info: 'Ambient noise sensor in Decibels 0-200 dBA', type: 'float', minValue: 0.0, maxValue: 200.0, value: 100.0, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'CarbonDioxide', index: 7, info: 'Carbon Dioxide Sensor, 0-2000ppm', type: 'integer', minValue: 0, maxValue: 2000, value: 500, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'Proximity', index: 8, info: 'Proximity sensor based e.g. on ultra-sound sensor, 0-800cm', type: 'integer', minValue: 0, maxValue: 800, value: 800, timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'Events', index: 9, info: 'Current events in the area, e.g. Oktoberfest', type: 'string', value: 'Oktoberfest', timestamp: '1970-01-01T00:00:00.000Z'},
          {id: 'TrafficDensity', index: 10, info: 'Normalized traffic density, 0-100', type: 'integer', minValue: 0, maxValue: 100, value: 50, timestamp: '1970-01-01T00:00:00.000Z'}]
        }}
      },
      {httpMethod: 'DELETE', path: '/api/devices/:deviceId', description: 'Delete the specified city hub device',
        sampleRequest: {path: '/api/devices/ch1'}},
      {separator: true},

      {httpMethod: 'GET', path: '/api/all/:sensorId', description: 'Get sensors status for all devices',
        sampleRequest: {path: '/api/all/AvailableParkingSpaces'}},
      {httpMethod: 'GET', path: '/api/all/:sensorId', description: 'Get sensors status forecast for all devices',
        sampleRequest: {path: '/api/all/AvailableParkingSpaces?action=forecast&year=' + now.getFullYear() + '&month=' + (now.getMonth()+1) + '&day=' + now.getDate() + '&hours=' + (now.getHours()+1) + '&minutes='  + now.getMinutes()}},
      {separator: true},

      {httpMethod: 'GET', path: '/api/devices/:deviceId/:sensorId', description: 'Get the specified sensor status',
        sampleRequest: {path: '/api/devices/ch1/AvailableParkingSpaces'}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId', description: 'Set the configuration/value of the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/AvailableParkingSpaces', body: {value: 5}}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId/process?action=book', description: 'Book a resource',
        sampleRequest: {path: '/api/devices/ch1/AvailableParkingSpaces/process?action=book', body: {userId: 'user1', password: 'user1.pass'}}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId/process?action=release', description: 'Release a resource',
        sampleRequest: {path: '/api/devices/ch1/AvailableParkingSpaces/process?action=release', body: {userId: 'user1', password: 'user1.pass'}}},
      {httpMethod: 'DELETE', path: '/api/devices/:deviceId/:sensorId', description: 'Delete the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/AvailableParkingSpaces'}},
      {separator: true},

      {httpMethod: 'GET', path: '/api/devices/:deviceId/:sensorId', description: 'Get the specified sensor status',
        sampleRequest: {path: '/api/devices/ch1/AvailableBikes'}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId', description: 'Set the configuration/value of the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/AvailableBikes', body: {value: 10, timestamp: timestampNow}}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId/process?action=book', description: 'Book a resource',
        sampleRequest: {path: '/api/devices/ch1/AvailableBikes/process?action=book', body: {userId: 'user1', password: 'user1.pass'}}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId/process?action=release', description: 'Release a resource',
        sampleRequest: {path: '/api/devices/ch1/AvailableBikes/process?action=release', body: {userId: 'user1', password: 'user1.pass'}}},
      {httpMethod: 'DELETE', path: '/api/devices/:deviceId/:sensorId', description: 'Delete the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/AvailableBikes'}},
      {separator: true},

      {httpMethod: 'GET', path: '/api/devices/:deviceId/:sensorId', description: 'Get the specified sensor status',
        sampleRequest: {path: '/api/devices/ch1/Temperature'}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId', description: 'Set the configuration/value of the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/Temperature', body: {value: 25, timestamp: timestampNow}}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId/decrease', description: 'Decrease the value of the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/Temperature/decrease', body: {timestamp: timestampNow}}},
      {httpMethod: 'POST', path: '/api/devices/:deviceId/:sensorId/increase', description: 'Increase the value of the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/Temperature/increase', body: {timestamp: timestampNow}}},
      {httpMethod: 'DELETE', path: '/api/devices/:deviceId/:sensorId', description: 'Delete the specified sensor',
        sampleRequest: {path: '/api/devices/ch1/Temperature'}}
    ];

    $scope.requestMethod = '';
    $scope.requestPath = '';
    $scope.requestBody = '';
    $scope.response = '';
    $scope.responseStatus = '';

    $scope.copy = function(api) {
      $scope.requestMethod = api.httpMethod;
      $scope.requestPath = api.sampleRequest.path;
      $scope.requestBody = api.sampleRequest.body ? JSON.stringify(api.sampleRequest.body, null, 4) : '';
      $scope.response = '';
      $scope.responseStatus = '';
    };

    $scope.execute = function() {
      if ($scope.requestMethod === 'GET') {
        $http.get($scope.requestPath).success(function(data, status) {
          $scope.response = JSON.stringify(data, null, 4);
          $scope.responseStatus = status;
          //console.log('GET success', $scope.response, $scope.responseStatus);
        })
          .error(function(data, status) {
            $scope.response = data;
            $scope.responseStatus = status;
            notify({message: 'Error in request: HTTP ' +  status, classes: 'alert-danger'});
          });
      } else if ($scope.requestMethod === 'POST') {
        $http.post($scope.requestPath, $scope.requestBody).success(function(data, status) {
          $scope.response = JSON.stringify(data, null, 4);
          $scope.responseStatus = status;
          //console.log('POST success', $scope.response, $scope.responseStatus);
        })
          .error(function(data, status) {
            $scope.response = data;
            $scope.responseStatus = status;
            notify({message: 'Error in request: HTTP ' +  status, classes: 'alert-danger'});
          });
      } else if ($scope.requestMethod === 'DELETE') {
        $http.delete($scope.requestPath).success(function(data, status) {
          $scope.response = JSON.stringify(data, null, 4);
          $scope.responseStatus = status;
          //console.log('DELETE success', $scope.response, $scope.responseStatus);
        })
          .error(function(data, status) {
            $scope.response = data;
            $scope.responseStatus = status;
            notify({message: 'Error in request: HTTP ' +  status, classes: 'alert-danger'});
          });
      }
    };

  });
