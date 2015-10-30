/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
'use strict';

var fs = require('fs');
var path = require('path');
var config = require('./environment');

var devices = [
    {id: 'ch1', info: 'Münchner Freiheit, Munich', latitude: 48.162553, longitude: 11.586440},
    {id: 'ch2', info: 'Odeonsplatz, Munich', latitude: 48.1419417, longitude: 11.5759829},
    {id: 'ch3', info: 'Marienplatz, Munich', latitude: 48.1373968, longitude: 11.5732598},
    {id: 'ch4', info: 'Karlsplatz, Munich', latitude: 48.1388877, longitude: 11.5642435},
    {id: 'ch5', info: 'Sendlinger Tor Platz, Munich', latitude: 48.134017, longitude: 11.567401},
    {id: 'ch6', info: 'Theresienwiese - Oktoberfest, Munich', latitude: 48.1320678, longitude: 11.5472914},
    {id: 'ch7', info: 'Universität, Munich', latitude: 48.1500645, longitude: 11.5662824},
    {id: 'ch8', info: 'Prinzregentenplatz, Munich', latitude: 48.1277837, longitude: 11.5773546},
    {id: 'ch9', info: 'Hauptbahnhof - Main Train Station, Munich', latitude: 48.140462, longitude: 11.5555776},
    {id: 'ch10', info: 'Fröttmaning - Soccer Arena, Munich', latitude: 48.2131391, longitude: 11.616277}];

var sensors = [
    {id: 'AvailableParkingSpaces', index: 1, info: 'Number of available parking spaces in the area, 0-500', type: 'integer', isBookable: true, pricePerHour: 1, minValue: 0, maxValue: 500, value: 10, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'AvailableBikes', index: 2, info: 'Number of available bikes for rent in the area, 0-20', type: 'integer', isBookable: true, pricePerHour: 5, minValue: 0, maxValue: 20, value: 5, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'Temperature', index: 3, info: 'Temperature sensor, -150 - +150 Celsius/Fahrenheit', type: 'float', minValue: -150.0, maxValue: 150.0, value: 20.0, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'Humidity', index: 4, info: 'Atmospheric relative humidity sensor, 10 - 95% RH', type: 'float', minValue: 10.0, maxValue: 95.0, value: 40.0, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'UVB', index: 5, info: 'Ultraviolet light sensor that responds primarily to UVB radiation, 290-320 nm', type: 'float', minValue: 290.0, maxValue: 320.0, value: 300.0, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'AmbientNoise', index: 6, info: 'Ambient noise sensor in Decibels 0-200 dBA', type: 'float', minValue: 0.0, maxValue: 200.0, value: 100.0, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'CarbonDioxide', index: 7, info: 'Carbon Dioxide Sensor, 0-2000ppm', type: 'integer', minValue: 0, maxValue: 2000, value: 500, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'PersonProximity', index: 8, info: '(Person) proximity sensor based e.g. on ultra-sound sensor, 0-800cm', type: 'integer', minValue: 0, maxValue: 800, value: 800, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'TrafficDensity', index: 9, info: 'Normalized traffic density, 0-100', type: 'integer', minValue: 0, maxValue: 100, value: 50, timestamp: '1970-01-01T00:00:00.000Z'},
    {id: 'Events', index: 10, info: 'Current events in the area', type: 'string', value: 'Market,Concert', timestamp: '1970-01-01T00:00:00.000Z'}];

var currentSensorDevices;
var forecastSensorDevices = {};

/**
 * Parse time string "HH:MM:SS"
 * @param timeString
 * @returns Date object / null
 */
function parseTime(timeString) {
  if (timeString == '') return null;

  var time = timeString.match(/(\d+)(:(\d\d))?(:(\d\d))/i);
  if (time == null) return null;

  var hours = parseInt(time[1],10);
  var d = new Date();
  d.setHours(hours);
  d.setMinutes(parseInt(time[3],10) || 0);
  d.setSeconds(parseInt(time[5],10) || 0, 0);
  return d;
}

/**
 * Read sensor values from file (JSON file array of objects: [{"dayOfWeek": 0-6, "time": "HH:MM:SS", "value": n}, ... ])
 * @param filePath
 * @returns {Array} {time: "HH:MM:SS", hours: 0-24, minutes: 0-59, seconds: 0-59, dayOfWeek: 0-6, value: n}, sorted by dayOfWeek/time
 */
function readSensorValuesJsonFile(filePath, isNumber) {
  var data = fs.readFileSync(filePath, 'utf8');
  var values = JSON.parse(data).values;
  for(var i = 0; i < values.length; i++) {
    // parse hours, minutes, seconds and add them to the objects
    if(values[i].time && !(values[i].hours || values[i].minutes || values[i].seconds)) {
      var date = parseTime(values[i].time);
      values[i].hours = date.getHours();
      values[i].minutes = date.getMinutes();
      values[i].seconds = date.getSeconds();
    }
    if(isNumber) {
      // convert values to number
      values[i].value = Number(values[i].value);
    }
  }
  return values.sort(sortEntryDateTime);
}

/**
 *
 * @param a {dayOfWeek: 0-6, hours: 0-24, minutes: 0-59, seconds: 0-59}
 * @param b {dayOfWeek: 0-6, hours: 0-24, minutes: 0-59, seconds: 0-59}
 */
function sortEntryDateTime(a, b) {
  var diff = a.dayOfWeek - b.dayOfWeek;
  if (diff !== 0) {
    return diff;
  }
  diff = a.hours - b.hours;
  if (diff !== 0) {
    return diff;
  }
  diff = a.minutes - b.minutes;
  if (diff !== 0) {
    return diff;
  }
  diff = a.seconds - b.seconds;
  return diff;
}

/**
 * Returns clone of the default list of devices with their associated sensors
 * @returns default list of devices
 */
function getDefaultDevices() {
  // clone device list
  var sensorDevices = JSON.parse(JSON.stringify(devices));
  // attach clone of sensors list to the devices
  for (var i = 0; i < sensorDevices.length; i++) {
    sensorDevices[i].sensors = JSON.parse(JSON.stringify(sensors));
  }
  return sensorDevices;
}

/**
 * Gets the current list of devices with their associated sensors
 * @returns list of devices
 */
function getDevices() {
  if (!currentSensorDevices) {
    currentSensorDevices = getDefaultDevices();
  }
  return currentSensorDevices;
}

/**
 * Sets the current list of devices with their associated sensors
 * @param sensorDevices
 */
function setDevices(sensorDevices) {
  currentSensorDevices = sensorDevices;
}

/**
 * Sets the current list of devices to its default value
 * @returns updated list of devices
 */
function setDevicesToDefault() {
  currentSensorDevices = getDefaultDevices();
  return currentSensorDevices;
}

/**
 * Gets the expected sensor value at the specified date
 * @param deviceId
 * @param sensorId
 * @param date
 * @returns {dayOfWeek: 0-6, hours: 0-23, minutes: 0-59, seconds: 0-59, value: value}
 */
function getSensorValueForecast(deviceId, sensorId, date) {
  // forecast look-up
  var dayOfWeek = date.getDay();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var forecastValues;

  // read forecast values from JSON file
  var valueFilesBasePath = path.join(config.root, 'values');
  var deviceSensorFile =  valueFilesBasePath + path.sep + deviceId + path.sep + sensorId + '.json';
  var genericSensorFile =  valueFilesBasePath + path.sep + sensorId + '.json';
  if (deviceId && fs.existsSync(deviceSensorFile)) {
    if (!forecastSensorDevices[deviceSensorFile]) {
      console.log('sensors.js getSensorValueForecast reading values from ' + deviceSensorFile + '...');
      forecastSensorDevices[deviceSensorFile] = readSensorValuesJsonFile(deviceSensorFile, true);
    }
    forecastValues = forecastSensorDevices[deviceSensorFile];
  } else if (fs.existsSync(genericSensorFile)) {
    if (!forecastSensorDevices[genericSensorFile]) {
      console.log('sensors.js getSensorValueForecast reading values from ' + genericSensorFile + '...');
      forecastSensorDevices[genericSensorFile] = readSensorValuesJsonFile(genericSensorFile, true);
    }
    forecastValues = forecastSensorDevices[genericSensorFile];
  }

  if (!forecastValues) {
    console.warn('sensors.js getSensorValueForecast no sensor forecast JSON file found!');
    return undefined;
  }

  // look-up value for the desired date/time on sorted list (sequential search, 1st entry before later timestamp)
  //console.log('sensors.js getSensorValueForecast', forecastValues);
  var foundEntry;
  var prevEntry;
  for (var i = 0; i < forecastValues.length; i++) {
    var entry = forecastValues[i];
    if (entry.dayOfWeek > dayOfWeek) {
      foundEntry = prevEntry;
      break;
    } else if (entry.dayOfWeek === dayOfWeek) {
      if (entry.hours > hours) {
        foundEntry = prevEntry;
        break;
      } else if (entry.hours === hours) {
        if (entry.minutes > minutes) {
          foundEntry = prevEntry;
          break;
        } else if (entry.minutes === minutes) {
          if (entry.seconds > seconds) {
            foundEntry = prevEntry;
            break;
          } else if (entry.seconds === seconds) {
            foundEntry = entry;
          }
        }
      }
    }
    prevEntry = entry;
  }

  if (!foundEntry) {
    console.warn('sensors.js getSensorValueForecast no sensor value forecast found!');
    return undefined;
  }
  else {
    //console.info('sensors.js getSensorValueForecast found sensor value forecast', foundEntry);
    return foundEntry;
  }
}


module.exports = {
  /**
   * Returns clone of the default list of devices with their associated sensors
   * @returns default list of devices
   */
  getDefaultDevices: getDefaultDevices,

  /**
   * Gets the current list of devices with their associated sensors
   * @returns list of devices
   */
  getDevices: getDevices,

  /**
   * Sets the current list of devices to its default value
   * @returns updated list of devices
   */
  setDevices: setDevices,

  /**
   * Sets the current list of devices to its default value
   * @returns updated list of devices
   */
  setDevicesToDefault: setDevicesToDefault,

  /**
   * Gets the expected sensor value at the specified date
   * @param deviceId
   * @param sensorId
   * @param date
   * @returns {dayOfWeek: 0-6, hours: 0-23, minutes: 0-59, seconds: 0-59, value: value}
   */
  getSensorValueForecast: getSensorValueForecast
};
