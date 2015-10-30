/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
/**
 * Command line interface for emulating sensors by setting sensor values through REST API (HTTP POST)
 */
'use strict';
/* global require */
/* global console */
/* global process */

var param = require('commander');
var _ = require('lodash');
var fs = require('fs');
var request = require('request');
var CronJob = require('cron').CronJob;

/**
 * Parse value range (e.g. 20..40)
 * @param val
 * @returns {Array}
 */
function parseRange(val) {
  return val.split('..').map(Number);
}

/**
 * Parse choice options (e.g. '')
 * @param val
 * @returns {Array}
 */
function parseChoices(val) {
  var choiceArray = val.split(',').map(String);
  // remove quotes ' "
  for (var i = 0; i < choiceArray.length; i++) {
    if (choiceArray[i]) {
      choiceArray[i] = choiceArray[i].replace(/^'?(.*)'?$/, '$1');
      choiceArray[i] = choiceArray[i].replace(/^"?(.*)"?$/, '$1');
    }
  }
  return choiceArray;
}

var DEFAULT_INTERVAL = 10; // 10s

// command line parameter specification
param
  .version('0.1.0')
  .option('-u, --uri <base-url>', 'Server base URI, e.g. http://127.0.0.1:9000/api/devices', 'http://127.0.0.1:9000/api/devices')
  .option('-d, --device <id>', 'City Hub Device ID', 'ch1')
  .option('-s, --sensor <id>', 'Sensor ID', 'AvailableBikes')
  .option('-v, --value <value>', 'Sensor value', String, '5')
  .option('-r, --range <min>..<max>', 'Sensor value range (for generating random values)', parseRange, [])
  .option('-c, --choice "<opt1>,<opt2>[,...<optn>]"', 'Sensor value strings (for randomly setting values)', parseChoices, [])
  .option('-t, --type <type>', 'Sensor value type int/float/string', 'string')
  .option('-i, --interval <seconds>', 'Interval in seconds for setting sensor values (either directly or in generated file)', 0)
  .option('-f, --file <file-path>', 'JSON file with sensor values to set (dayOfWeek sun=0, time, value)', '')
  .option('-g, --generate-file <filename>', 'Generate template JSON file with sensor values', '');

param.on('--help', function() {
  console.log('  Examples:');
  console.log('');
  console.log('    node cli/sensor.js --device ch1 --sensor AvailableBikes --file ./values/AvailableBikes.json');
  console.log('    node cli/sensor.js --generate-file ./values/AvailableBikes.json --range 0..20 --type int --interval 300');
  console.log('    node cli/sensor.js --device ch1 --sensor AvailableBikes --range 0..20 --type int --interval 10');
  console.log('    node cli/sensor.js --device ch1 --sensor AvailableParkingSpaces --file ./values/AvailableParkingSpaces.json');
  console.log('    node cli/sensor.js --generate-file ./values/AvailableParkingSpaces.json --range 0..40 --type int --interval 300');
  console.log('    node cli/sensor.js --device ch1 --sensor AvailableParkingSpaces --range 0..40 --type int');
  console.log('    node cli/sensor.js --device ch1 --sensor Events --file ./values/Events.json');
  console.log('    node cli/sensor.js --generate-file ./values/Events.json --choice "Oktoberfest,Market,Concert,Trade fair,Arts exposition,Trade fair; Concert" --interval 3600');
  console.log('    node cli/sensor.js --device ch1 --sensor Events --choice "Oktoberfest,Market,Concert,Trade fair,Arts exposition,Trade fair; Concert" --interval 3600');
  console.log('    node cli/sensor.js --device ch1 --sensor TrafficDensity --file ./values/TrafficDensity.json');
  console.log('    node cli/sensor.js --generate-file ./values/TrafficDensity.json --range 10..90 --type int --interval 300');
  console.log('    node cli/sensor.js --device ch1 --sensor TrafficDensity --range 0..100 --type int --interval 10');

  console.log('');
});

if (!process.argv.slice(2).length) {
  param.help();
}

param.parse(process.argv);
// ------------------------------

/**
 * Get value (either select random value from available choices, generate a random number within the specified range, or simply format value to given type)
 * @param value
 * @param min
 * @param max
 * @param choices
 * @param type
 * @returns {*}
 */
function getValue(value, min, max, choices, type) {
  if (choices && choices.length > 0) {
    // select random choice value
    var newChoiceIndex = Math.round(Math.random() * choices.length);
    var newValue = choices[newChoiceIndex];
    if (type === 'int') {
      // integer
      return Math.round(newValue);
    } else if (type === 'float') {
      // float
      return Number(newValue);
    } else {
      // string
      return newValue;
    }
  } else if ((min || min === 0) && (max || max === 0)) {
    // select random value within range
    var minNum = Number(min);
    var maxNum = Number(max);
    var range = maxNum - minNum;
    var newVal = Math.random() * range + minNum;
    if (type === 'int') {
      // integer
      return Math.round(newVal);
    } else {
      // float
      return Number(newVal);
    }
  } else {
    if (type === 'int') {
      // integer
      return Math.round(value);
    } else if (type === 'float') {
      // float
      return Number(value);
    } else {
      // string
      return value;
    }
  }
}

/**
 * Read sensor values from file (one value per line, either convert to number or strip \r\n)
 * @param filePath
 * @returns {Array}
 */
function readValuesFromFile(filePath, isNumber) {
  var data = fs.readFileSync(filePath, 'utf8');
  return data.split('\n').map(function(val) {return (isNumber? Number(val) : val.replace(/(\r\n|\n|\r)/gm,''));});
}

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
 * @returns {Array} {time: "HH:MM:SS", hours: 0-24, minutes: 0-59, seconds: 0-59, dayOfWeek: 0-6, value: n}
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
  return values;
}

/**
 * Generate JSON template file with sensor values
 * [{"dayOfWeek": 0-6, "time": "HH:MM:SS", "value": n}, ... ]
 */
function generateSensorJsonValuesTemplate() {
  var isNumber = param.type === 'int' || param.type === 'float';
  var intervalSeconds = param.interval? parseInt(param.interval) : 300;
  var SECONDS_IN_A_DAY = 24*3600;
  var nEntries = 0;
  var data;
  data = '{\n"values": [\n';
  for (var day = 0; day < 7; day++) {
    for (var tSeconds = 0; tSeconds < SECONDS_IN_A_DAY; tSeconds += intervalSeconds) {
      // get formatted time
      var time = (new Date(tSeconds * 1000)).toISOString().
        replace(/.+T/, ''). // delete T and everything before it
        replace(/\..+/, ''); // delete the dot and everything after
      var value = getValue(param.value, param.range[0], param.range[1], param.choice, param.type);
      if(nEntries > 0) {
        data += ',\n';
      }
      data += '{"dayOfWeek": ' + day + ', "time": "' + time + '", "value": ' + (isNumber ? '' : '"') + ((value===undefined) ? '' : value) + (isNumber ? '' : '"') + '}';
      nEntries++;
    }
  }
  data += '\n]\n}\n';

  fs.writeFile(param.generateFile, data, function (err) {
    if (err) {
      console.error('Error saving file ', param.generateFile, '!');
    }
    console.log('Saved file "' + param.generateFile + '" with ' + nEntries + ' entries (' + nEntries/7 +  ' entries per day).');
  });
}

/**
 * Send HTTP request
 * @param optObj
 * @param counter
 */
function sendRequest(optObj, counter) {
  var counterStr = '#' + counter;
  request(optObj, function(err, response) {
    if (err) {
      console.error('Sensor CLI: ' + counterStr + ' Error sending HTTP ' + optObj.method + ' request ' + optObj.uri + ':', err);
      return;
    }
    if (response.statusCode !== 200) {
      console.error('Sensor CLI: ' + counterStr + ' Error HTTP ' + optObj.method + ' request ' + optObj.uri + ' %j returned ' + response.statusCode, optObj.body);
      return;
    }
    console.log('Sensor CLI: ' + counterStr + ' HTTP ' + optObj.method + ' request ' + optObj.uri + ' %j returned ' + response.statusCode, optObj.body);
  });
}

/**
 * Helper function accessing global variables (subsequent set requests)
 */
function sendNextValue() {
  if (values) {
    if (counter > values.length - 1) {
      counter = 0;
    }
    optObj.body.value = values[counter];
  } else {
    optObj.body.value = getValue(param.value, param.range[0], param.range[1], param.choice, param.type);
  }
  sendRequest(optObj, counter++);
}

function getDayOfWeekStr(dayOfWeekId) {
  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Sunday'];
  return weekdays[dayOfWeekId];
}

function scheduleCronJob(cronTime, context) {
  var job = new CronJob({
    cronTime: cronTime,
    onTick: function() {
      console.log('-> Sensor CLI: Executing ' + context.time,  context.optObj.uri, '=', context.optObj.body.value);
      sendRequest(context.optObj, counter++);
    }.bind(this),
    start: false
  });
  job.start();
}

/**
 *
 * @param values array of {hours: 0-24, minutes: 0-59, seconds: 0-59, dayOfWeek: 0-6, value: n}
 */
function createCronJobsSendRequest(values) {
  var nJobs = 0;
  for(var i = 0; i < values.length; i++) {
    var cTime = values[i].seconds + ' ' + values[i].minutes + ' ' + values[i].hours + ' * * ' + values[i].dayOfWeek;
    var path = '/' + param.device + '/' + param.sensor;
    var uri = param.uri + path;
    var optObj = {uri: uri, method: 'POST', json: true, timeout: 10000 /* in ms */, proxy: undefined, body: {value: values[i].value}};
    var context = {optObj: optObj, time: getDayOfWeekStr(values[i].dayOfWeek) + ' ' + values[i].time};
    scheduleCronJob(cTime, context);
    console.log('Scheduled set request ' + '#' + nJobs + ' ' + getDayOfWeekStr(values[i].dayOfWeek) + ' ' + values[i].time + ' (' + cTime + '): ' + path + '=' + values[i].value);
    nJobs++;
  } // for
  console.log('--------------------------------------------------------------------------------------------------');
}

var counter = 0;
var values;
if (param.file) {
  // parse values from file and create cron jobs, if file param has been specified
  var isNumber = param.type === 'int' || param.type === 'float';
  values = readSensorValuesJsonFile(param.file, isNumber);
  if (values.length === 0) {
    console.error('Error parsing ' + (isNumber ? 'number' : '') + ' values from file ' + param.file);
    process.exit(1);
  }
  createCronJobsSendRequest(values);
}
else if (param.generateFile) {
  // generate JSON template file
  generateSensorJsonValuesTemplate();
}
else {
  // send POST requests for setting sensor values (single value or random values)

  // set basic request paramters
  var path = '/' + param.device + '/' + param.sensor;
  var uri = param.uri + path;
  var optObj = {uri: uri, method: 'POST', json: true, timeout: 10000 /* in ms */, proxy: undefined, body: {}};

  // send initial request
  sendNextValue();
  // send subsequent requests every x seconds (specified interval)
  var isRecurring = param.interval > 0;
  if (isRecurring) {
    setInterval(sendNextValue, param.interval * 1000);
  }
}
