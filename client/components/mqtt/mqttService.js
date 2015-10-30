/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';
/* global Paho */

angular.module('mqttService', [])
  .constant('_', _) // lodash
  .constant('Paho', Paho) // Paho MQTT Client
  .factory('mqttService', function(_, Paho) {

    var MQTT_RECONNECT_TIMEOUT_MS = 2000;
    var MQTT_SUBSCRIPTIONS = ['cityhub/#'];
    var MQTT_QOS_OPT = {qos: 0};
    var mqttHost;
    var mqttPort;
    var mqttClientId;
    var mqttSubscriptions;
    var mqttReconnectTimer;
    var mqttWsClient;
    var isConnected;
    var isDisconnectTriggered;
    var cbStatus;
    var cbMessage;

    /**
     *
     * @param host
     * @param port
     * @param clientId
     * @param subscriptions
     * @param callbackMessage callback function for incoming MQTT messages
     * @param callbackStatus callback function for status
     */
    function initMqtt(host, port, clientId, subscriptions, callbackMessage, callbackStatus) {
      mqttHost = host;
      mqttPort = port ? port : 9883;
      mqttClientId = clientId;
      mqttSubscriptions = subscriptions ? subscriptions : MQTT_SUBSCRIPTIONS;
      cbStatus = callbackStatus;
      cbMessage = callbackMessage;
      isConnected = false;
      isDisconnectTriggered = false;
      connect();
    }

    function connect() {
      mqttReconnectTimer = undefined;
      mqttWsClient = new Paho.MQTT.Client(mqttHost, Number(mqttPort), '', 'ChSensorsSdkWebMqttClient_' + mqttClientId + '_' + Math.floor((Math.random() * 1000) + 1));

      // set callback handlers
      mqttWsClient.onConnectionLost = onMqttConnectionLost;
      mqttWsClient.onMessageArrived = onMqttMessageArrived;
      mqttWsClient.onError = onMqttError;

      // connect the client
      if (cbStatus) {
        cbStatus('Connecting to ws://' + mqttHost + ':' + mqttPort + '...', isConnected);
      }
      mqttWsClient.connect({timeout: 3, onSuccess:onMqttConnect, onFailure:onMqttFailure});
    }

    function disconnect() {
      isDisconnectTriggered = true;

      // cancel reconnect timer
      if(mqttReconnectTimer) {
        //console.log('mqttService cancelling timer');
        clearTimeout(mqttReconnectTimer);
        mqttReconnectTimer = undefined;
      }
      if (cbStatus) {
        cbStatus('Not connected', false);
      }

      // disconnect
      mqttWsClient.disconnect();
    }

    function triggerReconnect() {
      if (mqttReconnectTimer) {
        clearTimeout(mqttReconnectTimer);
        mqttReconnectTimer = undefined;
      }
      mqttReconnectTimer = setTimeout(connect, MQTT_RECONNECT_TIMEOUT_MS);
    }

    // function called when the client connects
    function onMqttConnect() {
      // Once a connection has been made, make a subscription and send a message.
      console.log('onMqttConnect');
      isConnected = true;
      if (cbStatus) {
        cbStatus('Connected to ws://' + mqttHost + ':' + mqttPort + ' at ' + new Date().toISOString(), isConnected);
      }

      if (mqttSubscriptions) {
        // subscribe
        var nSubscriptions = mqttSubscriptions.length;
        for (var i = 0; i < nSubscriptions; i++) {
          subscribe(mqttSubscriptions[i]);
        }
      }
    }

    // function called when client connect fails
    function onMqttFailure() {
      console.log('onMqttFailure');
      isConnected = false;
      if(!isDisconnectTriggered) {
        if (cbStatus) {
          cbStatus('Failed to connect to ws://' + mqttHost + ':' + mqttPort + ' at ' + new Date().toISOString() + ', retrying...', isConnected);
        }
        triggerReconnect();
      }
    }

    // function called when the client loses its connection
    function onMqttConnectionLost(responseObject) {
      isConnected = false;
      if (responseObject.errorCode !== 0) { // 1 -> connect timeout, etc.
        console.log('onMqttConnectionLost:' + responseObject.errorMessage);
      }
      if(!isDisconnectTriggered) {
        if (cbStatus) {
          cbStatus('Disconnected from ws://' + mqttHost + ':' + mqttPort + ' at ' + new Date().toISOString() + ' [' + responseObject.errorMessage + '], reconnecting...', isConnected);
        }
        triggerReconnect();
      }
    }

    function onMqttError(responseObject) {
      isConnected = false;
      if(!isDisconnectTriggered) {
        if (cbStatus) {
          cbStatus('Error ws://' + mqttHost + ':' + mqttPort + ' [' + responseObject.errorMessage + '], reconnecting...', isConnected);
        }
        triggerReconnect();
      }
    }

    // function called when a message arrives
    function onMqttMessageArrived(message) {
      var nowStr = new Date().toISOString();
      //console.log('onMqttMessageArrived: ' + nowStr + ': [' + message.destinationName + '] "' + message.payloadString + '"');
      if (cbMessage) {
        var msg = {'topic': message.destinationName, 'message': message.payloadString, 'timestamp': nowStr};
        cbMessage(msg);
      }
    }

    function subscribe(topic) {
      //console.trace('mqttService.subscribe(' + topic + ')');
      try {
        mqttWsClient.subscribe(topic, MQTT_QOS_OPT);
        if (_.indexOf(mqttSubscriptions, topic) === -1) {
          mqttSubscriptions.push(topic);
        }
        return true;
      } catch (err) {
        console.error('Error subscribing:', err);
        return false;
      }
    }

    function unsubscribe(topic) {
      try {
        mqttWsClient.unsubscribe(topic);
        _.remove(mqttSubscriptions, topic);
        return true;
      } catch (err) {
        console.error('Error unsubscribing:', err);
        return false;
      }
    }

    function publish(topic, message, isRetained) {
      var mqttMsg = new Paho.MQTT.Message(message);
      mqttMsg.destinationName = topic;
      mqttMsg.retained = isRetained ? isRetained : false;
      try {
        mqttWsClient.send(mqttMsg);
        return true;
      } catch (err) {
        console.error('Error publishing message:', err);
        return false;
      }
    }

    return {
      connect: function(host, port, clientId, subscriptions, callbackMessage, callbackStatus) {
        initMqtt(host, port, clientId, subscriptions, callbackMessage, callbackStatus);
      },
      disconnect: disconnect,
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      publish: publish
    };

  });
