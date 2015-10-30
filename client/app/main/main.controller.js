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
      $http.get('/api/devices').success(function(devices) {
        $scope.devices = devices;
      })
        .error(function(data, status) {
          console.log('Error loading devices: ', status);
          notify({message: 'Error loading devices: HTTP ' +  status, classes: 'alert-danger'});
        });

      $http.get('/api/users').success(function(users) {
        $scope.users = users;
      })
        .error(function(data, status) {
          console.log('Error loading users: ', status);
          notify({message: 'Error loading users: HTTP ' +  status, classes: 'alert-danger'});
        });
    };

    $scope.loadConfig();

    /**
     * Helper method for copying angular annotations (improves UI refresh upon updates)
     * @param dst
     * @param src
     */
    function copyAngularAnnotations(dst, src) {
      for (var key in src) {
        var srcVal = src[key];
        var dstVal = dst[key];
        if (Array.isArray(srcVal) && Array.isArray(dstVal)) {
          for (var i = 0; i < srcVal.length; i++) {
            // check identity through id property
            var srcId = srcVal[i].id;
            if (srcId) {
              var indexDst = _.findIndex(dstVal, {id: srcId});
              if (indexDst !== -1) {
                copyAngularAnnotations(dstVal[indexDst], srcVal[i]);
              }
            }
          }
        }
        if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
          // copy angular $$hashKey fields
          //console.log('copyAngularAnnotations ' + key + '=' + srcVal);
          dst[key] = srcVal;
        }
      }
    }

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
    socket.socket.on('device:save', function(device) {
      console.log('Got websocket message device:save', device);
      if (device.id) {
        var indexDevice = _.findIndex($scope.devices, {id: device.id});
        if (indexDevice !== -1) {
          var deviceModified = angular.toJson($scope.devices[indexDevice]) !== JSON.stringify(device);
          if (deviceModified) {
            var oldDevice = $scope.devices[indexDevice];
            $scope.devices[indexDevice] = device;
            // copy angular hash codes from oldDevice to avoid full repaint
            copyAngularAnnotations($scope.devices[indexDevice], oldDevice);
            //console.log('old=' + JSON.stringify(oldDevice));
            //console.log('new=' + JSON.stringify($scope.devices[indexDevice]));
            notify({message: 'Device ' + device.id + ' reloaded (modified on server).', classes: 'alert-info'});
          }
        }
      } else {
        // reload full configuration
        $scope.loadConfig();
        notify({message: 'Devices reloaded (modified on server).', classes: 'alert-info'});
      }
    });
    socket.socket.on('device:remove', function(device) {
      console.log('Got websocket message device:remove', device);
      var removedElements = _.remove($scope.devices, {id: device.id});
      console.log('removedElements', removedElements);
      if (removedElements.length > 0) {
        notify({message: 'Device ' + device.id + ' removed on server.', classes: 'alert-info'});
      }
    });
    socket.socket.on('user:save', function(user) {
      console.log('Got websocket message user:save', user);
      if (user.id) {
        var indexUser = _.findIndex($scope.users, {id: user.id});
        if (indexUser !== -1) {
          var deviceModified = angular.toJson($scope.users[indexUser]) !== JSON.stringify(user);
          if (deviceModified) {
            var oldUser = $scope.users[indexUser];
            $scope.users[indexUser] = user;
            // copy angular hash codes from oldUser to avoid full repaint
            copyAngularAnnotations($scope.users[indexUser], oldUser);
            //console.log('old=' + JSON.stringify(oldUser));
            //console.log('new=' + JSON.stringify($scope.devices[indexUser]));
            notify({message: 'User ' + user.id + ' reloaded (modified on server).', classes: 'alert-info'});
          }
        }
      } else {
        // reload full configuration
        $scope.loadConfig();
        notify({message: 'Users reloaded (modified on server).', classes: 'alert-info'});
      }
    });
    socket.socket.on('user:remove', function(user) {
      console.log('Got websocket message user:remove', user);
      var removedElements = _.remove($scope.users, {id: user.id});
      console.log('removedElements', removedElements);
      if (removedElements.length > 0) {
        notify({message: 'User ' + user.id + ' removed on server.', classes: 'alert-info'});
      }
    });
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
      socket.socket.removeAllListeners('device:save');
      socket.socket.removeAllListeners('device:remove');
      socket.socket.removeAllListeners('user:save');
      socket.socket.removeAllListeners('user:remove');
    }

    $scope.$on('$destroy', function() {
      destroy();
    });

  });
