/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

angular.module('chSensorsApp')
  .controller('MqttCtrl', function($scope, $http, $location, mqttService, notify) {

    var MAX_MSGS = 200;

    var MQTT_IP = $location.host();
    var MQTT_WS_PORT = '9883';
    var MQTT_SUBSCRIPTIONS = ['cityhub/#'];

    $scope.status = '';
    $scope.isConnected = false;
    $scope.subscriptionTopic = '$SYS/#';
    $scope.messageTopic = 'cityhub/ch1/Temperature';
    $scope.message = '30';

    $scope.subscriptions = MQTT_SUBSCRIPTIONS;
    $scope.msgs = [];

    /////////////////// MQTT
    // function called when a message arrives
    function onMqttMessageArrived(message) {
      console.log('Received MQTT message', message);

      if ($scope.msgs.length >= MAX_MSGS) {
        // max msgs exceeded => remove half of messages
        console.log('max msgs exceeded => remove half of messages...');
        $scope.msgs = $scope.msgs.slice((MAX_MSGS / 2), -1);
      }

      $scope.msgs.push(message);
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    }

    function onMqttStatus(status, isConnected) {
      console.log('Received MQTT status', status, isConnected);
      $scope.status = status;
      $scope.isConnected = isConnected;
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    }

    function init() {
      // get MQTT IP config and init MQTT client
      var mqttHost = MQTT_IP;
      var mqttWsPort = MQTT_WS_PORT;
      mqttService.connect(mqttHost, mqttWsPort, $location.host(), MQTT_SUBSCRIPTIONS, onMqttMessageArrived, onMqttStatus);
    }

    init();

    function destroy() {
      mqttService.disconnect();
    }

    $scope.subscribe = function(topic) {
      if (mqttService.subscribe(topic)) {
        console.log('MQTT subscription add', topic);
        var isNewSubscription = true;
        for (var i = 0; i < $scope.subscriptions.length ; i++) {
          if ($scope.subscriptions[i] === topic) {
            isNewSubscription = false;
            break;
          }
        }
        if (isNewSubscription) {
          $scope.subscriptions.push(topic);
        }
      } else {
        console.error('Error subscribing for topic:', topic);
        notify({message: 'Error subscribing for topic: ' + topic, classes: 'alert-danger'});
      }
    };

    $scope.unsubscribe = function(topic) {
      if (mqttService.unsubscribe(topic)) {
        console.log('MQTT subscription remove', topic);
        for (var i = 0; i < $scope.subscriptions.length ; i++) {
          if ($scope.subscriptions[i] === topic) {
            $scope.subscriptions.splice(i, 1);
            break;
          }
        }
      } else {
        console.error('Error unsubscribing for topic:', topic);
        notify({message: 'Error unsubscribing for topic: ' + topic, classes: 'alert-danger'});
      }
    };

    $scope.publish = function(topic, message) {
      console.log('Publishing:', topic, message);
      if (!mqttService.publish(topic, message, true)) {
        console.error('Error publishing:', topic, message);
        notify({message: 'Error publishing: ' + topic + '=' + message, classes: 'alert-danger'});
      }
    };

    $scope.clearMessages = function() {
      console.log('Clearing messages...');
      $scope.msgs = [];
    };

    ///////////////////

    //////////////////////
    $scope.$on('$destroy', destroy);

  });
