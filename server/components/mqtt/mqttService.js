/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var MqttService = (function() {

  MqttService.debug = require('debug')('mqttService');

  function MqttService(onConnectCb, startupTopic, host, port) {
    this.onConnectCb = onConnectCb;
    this.subscribers = {};
    this.status = '';
    this.subscribedTopics = [];
    var config = require('../../config/environment');
    this.host = (host && host.length > 0) ? host : config.mqtt.host;
    this.port = (port && port > 0) ? port : config.mqtt.port;
    this.startupTopic = startupTopic;
    MqttService.debug('init: %s:%s topic=[%s]...', this.host, this.port, this.startupTopic ? this.startupTopic : '');
    this.connect();
  }

  MqttService.prototype.connect = function() {
    console.log('MqttService connecting to: [%s]:[%s] topic=[%s]...', this.host, this.port, this.startupTopic ? this.startupTopic : '');
    this.status = 'Connecting to ' + this.host + ':' + this.port + '...';
    var mqtt = require('mqtt');
    this.mqttClient = mqtt.connect({host: this.host, port: this.port, clientId: 'ChSensorsSdkMqttClient_' + Math.floor((Math.random() * 1000) + 1)});
    this.mqttClient.on('connect', this.onConnect.bind(this));
    this.mqttClient.on('message', this.onMessage.bind(this));
    this.mqttClient.on('close', this.onClose.bind(this));
    this.mqttClient.on('offline', this.onOffline.bind(this));
    this.mqttClient.on('error', this.onError.bind(this));
  };

  MqttService.prototype.getStatus = function() {
    return this.status;
  };

  MqttService.prototype.getLastError = function() {
    return this.lastError;
  };

  MqttService.prototype.disconnect = function() {
    MqttService.debug('disconnecting...');
    this.disconnect();
  };

  MqttService.prototype.onConnect = function() {
    console.log('==> MQTT connected to %s:%s [%s] at %s', this.host, this.port, this.startupTopic ? this.startupTopic : '', new Date().toISOString());
    this.isConnected = true;
    this.status = 'Connected to ' + this.host + ':' + this.port + ' at ' + (new Date());
    if (this.startupTopic) {
      this.subscribe(this.startupTopic);
    }
    if (this.onConnectCb) {
      try {
        this.onConnectCb();
      } catch (ex) {
        console.error('Exception calling onConnectCb', ex);
      }
    }
  };

  MqttService.prototype.onMessage = function(topic, message, payload) {
    MqttService.debug('received [%s]: "%s"', topic, message);
    for (var topicPrefix in this.subscribers) {
      if (topic.indexOf(topicPrefix) === 0) {
        var subscriberCb = this.subscribers[topicPrefix];
        try {
          subscriberCb(topic, message.toString());
        }
        catch (err) {
          console.log('Error in subscriber callback:', err);
        }
      }
    }
  };

  MqttService.prototype.onClose = function() {
    if (this.isConnected) {
      MqttService.debug('closed!');
      this.isConnected = false;
      this.status = 'Disconnected from ' + this.host + ':' + this.port + ' at ' + (new Date());
    }
  };

  MqttService.prototype.onOffline = function() {
    if (this.isConnected) {
      MqttService.debug('offline!');
      this.isConnected = false;
      this.status = 'Connection offline';
    }
  };

  MqttService.prototype.onError = function(error) {
    MqttService.debug('error: %s', error);
    this.lastError = error;
  };

  MqttService.prototype.registerSubscriber = function(topicPrefix, onMessage) {
    this.subscribers[topicPrefix] = onMessage;
  };

  MqttService.prototype.subscribe = function(topic, callback) {
    MqttService.debug('subscribing for [%s]...', topic);
    this.mqttClient.subscribe(topic, function(error, granted) {
      if (error) {
        MqttService.debug('error subscribing for [%s]: %s', topic, error);
      } else {
        // add topic to list, if not yet part of it
        var isNewSubscription = true;
        if (this.subscribedTopics.indexOf(topic) >= 0) {
          isNewSubscription = false;
        }
        if (isNewSubscription) {
          this.subscribedTopics.push(topic);
        }
      }
      MqttService.debug('subscription result for [%s]:', topic, granted);
      if (callback) {
        callback(error, granted);
      }
    }.bind(this));
  };

  MqttService.prototype.unsubscribe = function(topic, callback) {
    MqttService.debug('unsubscribing for [%s]...', topic);
    this.mqttClient.unsubscribe(topic, function(error) {
      if (error) {
        MqttService.debug('error unsubscribing for [%s]: %s', topic, error);
      } else {
        // remove topic from list
        var i = this.subscribedTopics.indexOf(topic);
        var isRemoved = false;
        if (i >= 0) {
          MqttService.instance.subscribedTopics.splice(i, 1);
          isRemoved = true;
        }
      }
      if (callback) {
        callback(error);
      }
    }.bind(this));
  };

  MqttService.prototype.isTopicSubscribed = function(topic) {
    for (var i = 0; i < this.subscribedTopics.length; i++) {
      if (this.subscribedTopics[i] === topic) {
        return true;
      }
    }
    return false;
  };

  MqttService.prototype.getSubscriptions = function() {
    return this.subscribedTopics.slice(0); // array clone
  };

  MqttService.prototype.publish = function(topic, message, options) {
    MqttService.debug('publishing [%s] %s (%j)...', topic, message, options);
    this.mqttClient.publish(topic, message, options);
  };

  return MqttService;
})();

exports.MqttService = MqttService;
