/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var _ = require('lodash');
var devices = require('../../config/sensors').getDevices();
var users = require('../../config/users').getUsers();
var deviceSocket = require('./device.socket');

var MQTT_PUBLISH_OPTS = {retain: true};

function checkValueRange(value, min, max) {
  var val;
  try {
    val = Number(value);
    if (((min || min === 0) && val < min) || ((max || max === 0) && val > max)) {
      val = 'out of range';
    }
  } catch (err) {
    val = 'not a number!';
  }
  return val;
}

function notifySensorValuesMqtt(app) {
  // notify sensor values through MQTT
  if (app.mqttService) {
    for (var i = 0; i < devices.length; i++) {
      var device = devices[i];
      for (var j = 0; j < device.sensors.length; j++) {
        var sensor = device.sensors[j];
        var isNumber = sensor.type === 'int' || sensor.type === 'float';
        var topic = 'cityhub/' + device.id + '/' + sensor.id;
        app.mqttService.publish(topic, '{"value": ' + (isNumber ? '' : '"') + sensor.value + (isNumber ? '' : '"') + ', "timestamp": "' + sensor.timestamp + '"}', MQTT_PUBLISH_OPTS);
      } // for
    } // for
  }
}
exports.notifySensorValuesMqtt = notifySensorValuesMqtt;

// Get list of devices/sensors
exports.index = function(req, res) {
  console.log('index', req.path);
  if (req.path === '/reset') {
    // reset devices to the default value
    console.log('Resetting to default configuration...');
    devices = require('../../config/sensors').setDevicesToDefault();
    // notify sensor values through MQTT
    notifySensorValuesMqtt(req.app);
    // notify new config through websocket
    deviceSocket.onDeviceChange();
  }
  res.json(devices);
};

// Get device
exports.getDevice = function(req, res) {
  var deviceId = req.params.deviceId;
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send('device not found');
  }
  var device = devices[deviceIndex];
  res.json(device);
};

// Set device
exports.setDevice = function(req, res) {
  var deviceId = req.params.deviceId;
  var uploadedDevice = req.body;
  //console.log('setDevice ' + deviceId, uploadedDevice);
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send('device not found');
  }
  var device = devices[deviceIndex];
  if (uploadedDevice.sensors) {
    var timestamp = new Date().toISOString();
    for (var i = 0; i < uploadedDevice.sensors.length; i++) {
      // check sensor value range
      var uploadedSensor = uploadedDevice.sensors[i];
      var uploadedSensorId = uploadedDevice.sensors[i].id;
      var sensorIndex = _.findIndex(device.sensors, {id: uploadedSensorId});
      if (sensorIndex !== -1) {
        var sensor = device.sensors[sensorIndex];

        if (!uploadedSensor.value && uploadedSensor.value !== 0 && uploadedSensor.value !== '') {
          console.log('Sensor value missing: ' + sensorId + ' ' + uploadedSensor.value);
          return res.status(400).send('sensor value missing');
        }

        // add sensor timestamp
        uploadedSensor.timestamp = timestamp;

        // check sensor value range
        if (sensor.type === 'float' || sensor.type === 'integer') {
          //console.log('checking value range of ' + deviceId + '/' + uploadedSensor.id + '=' + uploadedSensor.value + '...');
          var val = checkValueRange(uploadedSensor.value, sensor.minValue, sensor.maxValue);
          if (typeof(val) === 'string') {
            // value out of range
            console.log('Invalid value: ' + sensorId + ' ' + uploadedSensor.value + ' ' + val);
            return res.status(400).send(sensorId + ': value ' + uploadedSensor.value + ' ' + val);
          } else {
            // force number conversion
            uploadedSensor.value = val;
          }
        }
      } // if (sensorIndex !== -1)
    } // for
  }
  _.merge(device, uploadedDevice);

  // notify set device sensor values through MQTT
  if (req.app.mqttService) {
    for (var j = 0; j < uploadedDevice.sensors.length; j++) {
      var iSensor = uploadedDevice.sensors[j];
      var sensorId = uploadedDevice.sensors[j].id;
      var topic = 'cityhub/' + deviceId + '/' + sensorId;
      var isNumber = iSensor.type === 'int' || iSensor.type === 'float';
      req.app.mqttService.publish(topic, '{"value": ' + (isNumber ? '' : '"') + iSensor.value + (isNumber ? '' : '"') + ', "timestamp": "' + iSensor.timestamp + '"}', MQTT_PUBLISH_OPTS);
    }
  }

  // notify modified device ID through websocket
  deviceSocket.onDeviceChange(device);

  res.json(device);
};

// Delete device
exports.deleteDevice = function(req, res) {
  var deviceId = req.params.deviceId;
  var removedDevices = _.remove(devices, {id: deviceId});
  if (removedDevices.length === 0) {
    return res.status(404).send();
  }

  // notify deleted device through MQTT
  var delDevice = removedDevices[0];
  if (req.app.mqttService) {
    if (delDevice) {
      for (var j = 0; j < delDevice.sensors.length; j++) {
        var sensorId = delDevice.sensors[j].id;
        var topic = 'cityhub/' + deviceId + '/' + sensorId;
        req.app.mqttService.publish(topic, '{"value": "", "timestamp": ""}', MQTT_PUBLISH_OPTS);
      }
    }
  }

  // notify deleted device ID through websocket
  deviceSocket.onDeviceDelete(delDevice);

  return res.json(removedDevices);
};

// Get device sensor
exports.getSensor = function(req, res) {
  var deviceId = req.params.deviceId;
  var sensorId = req.params.sensorId;
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send('device not found');
  }
  var device = devices[deviceIndex];
  var sensorIndex = _.findIndex(device.sensors, {id: sensorId});
  if (sensorIndex === -1) {
    return res.status(404).send('sensor not found');
  }
  var sensor = device.sensors[sensorIndex];
  res.json(sensor);
};

// Set device sensor
exports.setSensor = function(req, res) {
  //console.log('setSensor');
  var deviceId = req.params.deviceId;
  var sensorId = req.params.sensorId;
  var uploadedSensor = req.body;
  console.log('setSensor ' + deviceId + '/' + sensorId + '=', uploadedSensor);
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send();
  }
  var device = devices[deviceIndex];
  var sensorIndex = _.findIndex(device.sensors, {id: sensorId});
  if (sensorIndex === -1) {
    return res.status(404).send('sensor not found');
  }
  // check sensor value range
  if (!uploadedSensor.value && uploadedSensor.value !== 0 && uploadedSensor.value !== '') {
    console.log('Sensor value missing: ' + sensorId + ' ' + uploadedSensor.value);
    return res.status(400).send('sensor value missing');
  }

  if (device.sensors[sensorIndex].type === 'float' || device.sensors[sensorIndex].type === 'integer') {
    var val = checkValueRange(uploadedSensor.value, device.sensors[sensorIndex].minValue, device.sensors[sensorIndex].maxValue);
    if (typeof(val) === 'string') {
      // value out of range
      console.log('Invalid value: ' + sensorId + ' ' + uploadedSensor.value + ' ' + val);
      return res.status(400).send(sensorId + ': value ' + uploadedSensor.value + ' ' + val);
    } else {
      // force number conversion
      uploadedSensor.value = val;
    }
  }

  if (!uploadedSensor.timestamp || uploadedSensor.timestamp === '') {
    // add timestamp to sensor
    uploadedSensor.timestamp = new Date().toISOString();
  }
  _.merge(device.sensors[sensorIndex], uploadedSensor);
  //console.log('merged sensor data: ', device.sensors[sensorIndex])

  // notify sensor value through MQTT
  if (req.app.mqttService) {
    var topic = 'cityhub/' + deviceId + '/' + sensorId;
    var isNumber = device.sensors[sensorIndex].type === 'int' || device.sensors[sensorIndex].type === 'float';
    req.app.mqttService.publish(topic, '{"value": ' + (isNumber ? '' : '"') + uploadedSensor.value + (isNumber ? '' : '"') + ', "timestamp": "' + uploadedSensor.timestamp + '"}', MQTT_PUBLISH_OPTS);
  }

  // notify modified sensor value through websocket
  deviceSocket.onDeviceChange(device);

  res.json(device.sensors[sensorIndex]);
};

// Increase sensor value
exports.increaseSensor = function(req, res) {
  //console.log('increaseSensor');
  var deviceId = req.params.deviceId;
  var sensorId = req.params.sensorId;
  var uploadedSensor = req.body;
  console.log('increaseSensor ' + deviceId + '/' + sensorId + '=', uploadedSensor);
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send();
  }
  var device = devices[deviceIndex];
  var sensorIndex = _.findIndex(device.sensors, {id: sensorId});
  if (sensorIndex === -1) {
    return res.status(404).send('sensor not found');
  }
  // check sensor value range
  if (device.sensors[sensorIndex].type === 'string') {
    return res.status(400).send('increase/decrease sensor value not supported for value type string');
  }
  uploadedSensor.value = device.sensors[sensorIndex].value + 1;
  if (device.sensors[sensorIndex].type === 'float' || device.sensors[sensorIndex].type === 'integer') {
    var val = checkValueRange(uploadedSensor.value, device.sensors[sensorIndex].minValue, device.sensors[sensorIndex].maxValue);
    if (typeof(val) === 'string') {
      // value out of range
      console.log('Invalid value: ' + sensorId + ' ' + uploadedSensor.value + ' ' + val);
      return res.status(400).send(sensorId + ': value ' + uploadedSensor.value + ' ' + val);
    } else {
      // force number conversion
      uploadedSensor.value = val;
    }
  }

  if (!uploadedSensor.timestamp || uploadedSensor.timestamp === '') {
    // add timestamp to sensor
    uploadedSensor.timestamp = new Date().toISOString();
  }
  _.merge(device.sensors[sensorIndex], uploadedSensor);
  //console.log('merged sensor data: ', device.sensors[sensorIndex])

  // notify sensor value through MQTT
  if (req.app.mqttService) {
    var topic = 'cityhub/' + deviceId + '/' + sensorId;
    var isNumber = device.sensors[sensorIndex].type === 'int' || device.sensors[sensorIndex].type === 'float';
    req.app.mqttService.publish(topic, '{"value": ' + (isNumber ? '' : '"') + uploadedSensor.value + (isNumber ? '' : '"') + ', "timestamp": "' + uploadedSensor.timestamp + '"}', MQTT_PUBLISH_OPTS);
  }

  // notify modified sensor value through websocket
  deviceSocket.onDeviceChange(device);

  res.json(device.sensors[sensorIndex]);
};

// Decrease sensor value
exports.decreaseSensor = function(req, res) {
  //console.log('decreaseSensor');
  var deviceId = req.params.deviceId;
  var sensorId = req.params.sensorId;
  var uploadedSensor = req.body;
  console.log('decreaseSensor ' + deviceId + '/' + sensorId + '=', uploadedSensor);
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send();
  }
  var device = devices[deviceIndex];
  var sensorIndex = _.findIndex(device.sensors, {id: sensorId});
  if (sensorIndex === -1) {
    return res.status(404).send('sensor not found');
  }
  if (device.sensors[sensorIndex].type === 'string') {
    return res.status(400).send('increase/decrease sensor value not supported for value type string');
  }
  // check sensor value range
  uploadedSensor.value = device.sensors[sensorIndex].value - 1;
  console.log('decreased sensor ' + deviceId + '/' + sensorId + '=', uploadedSensor);
  if (device.sensors[sensorIndex].type === 'float' || device.sensors[sensorIndex].type === 'integer') {
    var val = checkValueRange(uploadedSensor.value, device.sensors[sensorIndex].minValue, device.sensors[sensorIndex].maxValue);
    if (typeof(val) === 'string') {
      // value out of range
      console.log('Invalid value: ' + sensorId + ' ' + uploadedSensor.value + ' ' + val);
      return res.status(400).send(sensorId + ': value ' + uploadedSensor.value + ' ' + val);
    } else {
      // force number conversion
      uploadedSensor.value = val;
    }
  }

  if (!uploadedSensor.timestamp || uploadedSensor.timestamp === '') {
    // add timestamp to sensor
    uploadedSensor.timestamp = new Date().toISOString();
  }
  _.merge(device.sensors[sensorIndex], uploadedSensor);
  //console.log('merged sensor data: ', device.sensors[sensorIndex])

  // notify sensor value through MQTT
  if (req.app.mqttService) {
    var topic = 'cityhub/' + deviceId + '/' + sensorId;
    var isNumber = device.sensors[sensorIndex].type === 'int' || device.sensors[sensorIndex].type === 'float';
    req.app.mqttService.publish(topic, '{"value": ' + (isNumber ? '' : '"') + uploadedSensor.value + (isNumber ? '' : '"') + ', "timestamp": "' + uploadedSensor.timestamp + '"}', MQTT_PUBLISH_OPTS);
  }

  // notify modified sensor value through websocket
  deviceSocket.onDeviceChange(device);

  res.json(device.sensors[sensorIndex]);
};

// Process action book/release
exports.process = function(req, res) {
  //console.log('process');
  var deviceId = req.params.deviceId;
  var sensorId = req.params.sensorId;
  var action = req.query.action;
  var timestamp = req.body.timestamp;
  var userId = req.body.userId;
  var password = req.body.password;
  console.log('process ' + deviceId + '/' + sensorId + ' action=' + action, req.body);
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send();
  }
  var device = devices[deviceIndex];
  var sensorIndex = _.findIndex(device.sensors, {id: sensorId});
  if (sensorIndex === -1) {
    return res.status(404).send('sensor not found');
  }
  if(action !== 'book' && action !== 'release') {
    return res.status(400).send('process action=' + action + ' not supported');
  }
  // check whether item is bookable
  if (!device.sensors[sensorIndex].isBookable) {
    return res.status(400).send('process API not supported for non-bookable item ' + deviceId + '/' + sensorId);
  }
  // check user credentials
  var userIndex = _.findIndex(users, {id: userId});
  if (userIndex === -1) {
    return res.status(403).send('Unknown user');
  }
  if (users[userIndex].password !== password) {
    return res.status(403).send('Wrong password');
  }

  // check value range
  var isBooking = action === 'book';
  var newValue = isBooking ? device.sensors[sensorIndex].value + 1 : device.sensors[sensorIndex].value - 1;
  if (((device.sensors[sensorIndex].minValue || device.sensors[sensorIndex].minValue === 0) && newValue < device.sensors[sensorIndex].minValue)) {
    return res.status(400).send(sensorId + ': resource not available (' + device.sensors[sensorIndex].value + ')');
  }
  if (((device.sensors[sensorIndex].maxValue || device.sensors[sensorIndex].maxValue === 0) && newValue > device.sensors[sensorIndex].maxValue)) {
    return res.status(400).send(sensorId + ': max resources already released (' + device.sensors[sensorIndex].value + ')');
  }
  var newSensor = {value: newValue, timestamp: timestamp};

  if (!newSensor.timestamp || newSensor.timestamp === '') {
    // add timestamp to sensor
    newSensor.timestamp = new Date().toISOString();
  }
  _.merge(device.sensors[sensorIndex], newSensor);
  //console.log('merged sensor data: ', device.sensors[sensorIndex])

  // notify sensor value through MQTT
  if (req.app.mqttService) {
    var topic = 'cityhub/' + deviceId + '/' + sensorId;
    var isNumber = device.sensors[sensorIndex].type === 'int' || device.sensors[sensorIndex].type === 'float';
    req.app.mqttService.publish(topic, '{"value": ' + (isNumber ? '' : '"') + newSensor.value + (isNumber ? '' : '"') + ', "timestamp": "' + newSensor.timestamp + '"}', MQTT_PUBLISH_OPTS);
  }

  // notify modified sensor value through websocket
  deviceSocket.onDeviceChange(device);

  var confirmationId = 'XYZ' + Math.floor((Math.random() * 1000000) + 1);
  var response = {confirmationId: confirmationId, comments: 'resource ' + deviceId + '/' + sensorId + ' ' + action + 'ed by user ' + userId, timestamp: device.sensors[sensorIndex].timestamp};
  res.json(201, response);
};

// Delete sensor
exports.deleteSensor = function(req, res) {
  var deviceId = req.params.deviceId;
  var sensorId = req.params.sensorId;
  var deviceIndex = _.findIndex(devices, {id: deviceId});
  if (deviceIndex === -1) {
    return res.status(404).send('device not found');
  }
  var device = devices[deviceIndex];
  var removedSensors = _.remove(device.sensors, {id: sensorId});
  if (removedSensors.length === 0) {
    return res.status(404).send('sensor not found');
  }

  // notify deleted sensor through MQTT
  if (req.app.mqttService) {
    var topic = 'cityhub/' + deviceId + '/' + sensorId;
    req.app.mqttService.publish(topic, '{"value": "", "timestamp": ""}', MQTT_PUBLISH_OPTS);
  }

  // notify deleted sensor ID through websocket
  deviceSocket.onDeviceChange(device);

  return res.json(removedSensors);
};

