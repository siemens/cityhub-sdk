/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

angular.module('chSensorsApp')
  .controller('MainCtrl', function($scope, $http, _, notify, socket) {
    $scope.devices = [];
    $scope.users = [];

    $scope.loadConfig = function() {
      $http.get('/api/devices')
      .success(function(devices) {
        $scope.devices = devices;
        socket.unsyncUpdates('device');
        socket.syncUpdates('device', $scope.devices, function(event, device) {
          //console.log('Got websocket message', event, sensor);
          if (event === 'created' || event === 'updated') {
            // created / updated
            if (!device.id) {
              // reload full configuration
              $scope.loadConfig();
              notify({message: 'Device sensors reloaded (modified on server).', classes: 'alert-info'});
            }
          } else {
            // removed
            notify({message: 'Device sensors ' + device.id + ' removed on server.', classes: 'alert-info'});
          }
        });
      })
      .error(function(data, status) {
        console.log('Error loading devices: ', status);
        notify({message: 'Error loading devices: HTTP ' +  status, classes: 'alert-danger'});
      });

      $http.get('/api/users')
      .success(function(users) {
        $scope.users = users;
        socket.unsyncUpdates('user');
        socket.syncUpdates('user', $scope.users, function(event, user) {
          //console.log('Got websocket message', event, sensor);
          if (event === 'created' || event === 'updated') {
            // created / updated
            if (!user.id) {
              // reload full configuration
              $scope.loadConfig();
              notify({message: 'Users reloaded (modified on server).', classes: 'alert-info'});
            }
          } else {
            // removed
            notify({message: 'Users ' + user.id + ' removed on server.', classes: 'alert-info'});
          }
        });
      })
      .error(function(data, status) {
        console.log('Error loading users: ', status);
        notify({message: 'Error loading users: HTTP ' +  status, classes: 'alert-danger'});
      });
    };

    $scope.loadConfig();

    ///////////////////
    // register SocketIO connection callback
    var isFirstConnect = true;
    var socketSyncConnectCb = function(event) {
      //console.log('socket.socketSyncConnectCb cb(%s) %o', event, socket);
      if (event === 'connect') {
        if (!isFirstConnect) {
          // data might have changed in the mean time, reload it (note that data is already loaded during first load = initial connect)
          $scope.loadConfig();
        } else {
          isFirstConnect = false;
        }
      } else if (event === 'disconnect') {
      }
    };
    socket.syncConnection(socketSyncConnectCb);
    ///////////////////

    $scope.resetConfig = function() {
      $http.get('/api/devices/reset').success(function(devices) {
        $scope.devices = devices;
        notify({message: 'Successfully reset device config.', classes: 'alert-success'});
      })
      .error(function(data, status) {
        console.log('Error reloading devices: ', status);
        notify({message: 'Error reloading devices: HTTP ' + status, classes: 'alert-danger'});
      });

      $http.get('/api/users/reset').success(function(users) {
        $scope.users = users;
        notify({message: 'Successfully reset user config.', classes: 'alert-success'});
      })
        .error(function(data, status) {
          console.log('Error reloading users: ', status);
          notify({message: 'Error reloading devices: HTTP ' + status, classes: 'alert-danger'});
        });
    };

    $scope.orderByIndexFunction = function(sensor) {
      return parseInt(sensor.index);
    };

    $scope.saveDevice = function(device) {
      $http.post('/api/devices/' + device.id, angular.toJson(device)).
        success(function(data, status) {
          //$scope.loadConfig();
          notify({message: 'Successfully set device ' + device.id + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error saving device ' + device.id + ': ', status);
          notify({message: 'Error saving device ' + device.id + ': HTTP ' + status, classes: 'alert-danger'});
        });

    };

    $scope.deleteDevice = function(device) {
      console.log('deleteDevice', device);
      _.pull($scope.devices, device);
      $http.delete('/api/devices/' + device.id).
        success(function(data, status) {
          notify({message: 'Successfully deleted device ' + device.id + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error deleting device ' + device.id + ': ', status);
          notify({message: 'Error deleting device ' + device.id + ': HTTP ' + status, classes: 'alert-danger'});
          $scope.loadConfig();
        });
    };

    $scope.resetDevice = function(device) {
      // reload device data
      $http.get('/api/devices/' + device.id).
        success(function(data, status) {
          var index = _.findIndex($scope.devices, device);
          //console.log('Resetting index=' + index, data);
          if (index !== -1) {
            $scope.devices[index] = data;
            notify({message: 'Successfully reset device ' + device.id + '.', classes: 'alert-success'});
          }
        })
        .error(function(data, status) {
          console.log('Error reloading device ' + device.id + ': ', status);
          notify({message: 'Error reloading device ' + device.id + ': HTTP ' + status, classes: 'alert-danger'});
        });
    };

    $scope.resetSensor = function(device, sensor) {
      $http.get('/api/devices/' + device.id + '/' + sensor.id).
        success(function(data, status) {
          var sensorIndex = _.findIndex(device.sensors, {id: sensor.id});
          //console.log('sensorIndex', device.sensors, sensor.id, sensorIndex);
          if (sensorIndex !== -1) {
            console.log('resetSensor ' + device.id + '/' + sensor.id, data);
            device.sensors[sensorIndex] = data;
          }
        })
        .error(function(data, status) {
          console.log('Error getting sensor value: ', status);
          notify({message: 'Error getting sensor value ' + device.id + '/' + sensor.id + ': HTTP ' + status, classes: 'alert-danger'});
        });
    };

    $scope.saveSensor = function(device, sensor) {
      sensor.timestamp = new Date().toISOString();
      $http.post('/api/devices/' + device.id + '/' + sensor.id, {'value': sensor.value ? sensor.value : '', 'timestamp': sensor.timestamp}).
        success(function(data, status) {
          //$scope.loadConfig();
          notify({message: 'Successfully set ' + device.id + '/' + sensor.id + '=' + sensor.value + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error saving sensor value: ', status);
          notify({message: 'Error saving sensor value ' + device.id + '/' + sensor.id + ': HTTP ' + status, classes: 'alert-danger'});
        });
    };

    $scope.increaseSensor = function(device, sensor) {
      sensor.timestamp = new Date().toISOString();
      $http.post('/api/devices/' + device.id + '/' + sensor.id + '/increase', {'timestamp': sensor.timestamp}).
        success(function(data, status) {
          //$scope.loadConfig();
          sensor.value = data.value;
          notify({message: 'Successfully increased sensor value ' + device.id + '/' + sensor.id + '=' + sensor.value + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error increasing sensor value: ', status);
          notify({message: 'Error increasing sensor value ' + device.id + '/' + sensor.id + ': HTTP ' + status + ' (' + data + ')', classes: 'alert-danger'});
        });
    };

    $scope.decreaseSensor = function(device, sensor) {
      sensor.timestamp = new Date().toISOString();
      $http.post('/api/devices/' + device.id + '/' + sensor.id + '/decrease', {'timestamp': sensor.timestamp}).
        success(function(data, status) {
          //$scope.loadConfig();
          sensor.value = data.value;
          notify({message: 'Successfully decreased sensor value ' + device.id + '/' + sensor.id + '=' + sensor.value + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error decreasing sensor value: ', status);
          notify({message: 'Error decreasing sensor value ' + device.id + '/' + sensor.id + ': HTTP ' + status + ' (' + data + ')', classes: 'alert-danger'});
        });
    };

    $scope.deleteSensor = function(device, sensor) {
      //console.log('deleteSensor', device, sensor);
      _.pull(device.sensors, sensor);
      $http.delete('/api/devices/' + device.id + '/' + sensor.id).
        success(function(data, status) {
          notify({message: 'Successfully deleted sensor ' + device.id + '/' + sensor.id + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error deleting sensor: ', status);
          notify({message: 'Error deleting sensor ' + device.id + '/' + sensor.id + ': HTTP ' + status, classes: 'alert-danger'});
          $scope.loadConfig();
        });
    };

    $scope.resetSensor = function(device, sensor) {
      $http.get('/api/devices/' + device.id + '/' + sensor.id).
        success(function(data, status) {
          var sensorIndex = _.findIndex(device.sensors, {id: sensor.id});
          //console.log('sensorIndex', device.sensors, sensor.id, sensorIndex);
          if (sensorIndex !== -1) {
            console.log('resetSensor ' + device.id + '/' + sensor.id, data);
            device.sensors[sensorIndex] = data;
          }
        })
        .error(function(data, status) {
          console.log('Error getting sensor value: ', status);
          notify({message: 'Error getting sensor value ' + device.id + '/' + sensor.id + ': HTTP ' + status, classes: 'alert-danger'});
        });
    };

    $scope.saveSensor = function(device, sensor) {
      sensor.timestamp = new Date().toISOString();
      $http.post('/api/devices/' + device.id + '/' + sensor.id, {'value': sensor.value ? sensor.value : '', 'timestamp': sensor.timestamp}).
        success(function(data, status) {
          //$scope.loadConfig();
          notify({message: 'Successfully set ' + device.id + '/' + sensor.id + '=' + sensor.value + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error saving sensor value: ', status);
          notify({message: 'Error saving sensor value ' + device.id + '/' + sensor.id + ': HTTP ' + status, classes: 'alert-danger'});
        });
    };

    $scope.saveUser = function(user) {
      $http.post('/api/users/' + user.id, angular.toJson(user)).
        success(function(data, status) {
          //$scope.loadConfig();
          notify({message: 'Successfully set user ' + user.id + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error saving device ' + user.id + ': ', status);
          notify({message: 'Error saving user ' + user.id + ': HTTP ' + status, classes: 'alert-danger'});
        });
    };

    $scope.deleteUser = function(user, event) {
      _.pull($scope.users, user);
      $http.delete('/api/users/' + user.id).
        success(function(data, status) {
          notify({message: 'Successfully deleted user ' + user.id + '.', classes: 'alert-success'});
        })
        .error(function(data, status) {
          console.log('Error deleting user ' + user.id + ': ', status);
          notify({message: 'Error deleting user ' + user.id + ': HTTP ' + status, classes: 'alert-danger'});
          $scope.loadConfig();
        });
    };

    $scope.resetUser = function(user) {
      // reload device data
      $http.get('/api/users/' + user.id).
        success(function(data, status) {
          var index = _.findIndex($scope.users, user);
          //console.log('Resetting index=' + index, data);
          if (index !== -1) {
            $scope.users[index] = data;
            notify({message: 'Successfully reset user ' + user.id + '.', classes: 'alert-success'});
          }
        })
        .error(function(data, status) {
          console.log('Error reloading user ' + user.id + ': ', status);
          notify({message: 'Error reloading user ' + user.id + ': HTTP ' + status, classes: 'alert-danger'});
        });
    };

    function destroy() {
      socket.unsyncUpdates('device');
      socket.unsyncUpdates('user');
    }

    $scope.$on('$destroy', function() {
      destroy();
    });

  });
