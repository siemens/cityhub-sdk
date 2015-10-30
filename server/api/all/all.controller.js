/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var _ = require('lodash');
var Sensors = require('../../config/sensors');
var devices = Sensors.getDevices();

// Get sensors from all devices (either current status/value or value forecast)
exports.getSensors = function(req, res) {
  var action = req.query.action;
  var now = new Date();
  var year = req.query.year || now.getYear();
  var month = req.query.month? (req.query.month - 1) : now.getMonth();
  var day = req.query.day || now.getDay();
  var hours = req.query.hours || now.getHours();
  var minutes = req.query.minutes || now.getMinutes();
  var forecastDate = new Date(year, month, day, hours, minutes, 0, 0);
  var sensorId = req.params.sensorId;
  var deviceSensors = [];
  if (action === 'forecast') {
    // get forecast for all sensor values
    _.forEach(devices, function (device) {
      var sensor = _.find(device.sensors, {id: sensorId});
      if (sensor) {
        // clone device and sensor
        var deviceClone = JSON.parse(JSON.stringify(device));
        delete deviceClone.sensors;
        var sensorClone = JSON.parse(JSON.stringify(sensor));
        delete sensorClone.index;
        // set expected sensor value
        sensorClone.timestamp = forecastDate.toISOString();
        var forecast = Sensors.getSensorValueForecast(device.id, sensor.id, forecastDate);
        sensorClone.value = forecast? forecast.value : '?';
        // push clone of matched sensor to deviceSensors list
        deviceClone.sensor = sensorClone;
        deviceSensors.push(deviceClone);
      }
    });
  }
  else if (!action) {
    // get current state
    _.forEach(devices, function (device) {
      var sensor = _.find(device.sensors, {id: sensorId});
      if (sensor) {
        // clone device and sensor
        var deviceClone = JSON.parse(JSON.stringify(device));
        delete deviceClone.sensors;
        var sensorClone = JSON.parse(JSON.stringify(sensor));
        delete sensorClone.index;
        // push clone of matched sensor to deviceSensors list
        deviceClone.sensor = sensorClone;
        deviceSensors.push(deviceClone);
      }
    });
  }
  else {
    // action not supported
    return res.status(400).send('action not supported ' + action);
  }
  if (deviceSensors.length === 0) {
    return res.status(404).send('sensor not found');
  }
  res.json(deviceSensors);
};
