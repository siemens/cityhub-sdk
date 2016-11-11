/**
 * Main application file
 */
'use strict';

// Set default node environment to production
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
console.log('==> NODE_ENV =', process.env.NODE_ENV);

var express = require('express');
var config = require('./config/environment');

// Setup server
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// init websocket
app.socketio = require('socket.io')(server, {
  //serveClient: (config.env === 'production') ? false : true,
  serveClient: true,
  path: '/socket.io-client'
});
require('./config/socketio')(app.socketio);

// Connect to MQTT Broker
var MqttService = require('./components/mqtt/mqttService').MqttService;
app.mqttService = new MqttService(function() {
  // upon connection notify initial sensor values
  var deviceController = require('./api/device/device.controller.js');
  deviceController.notifySensorValuesMqtt(app);
});

// Start server
server.listen(config.port, config.ip, function() {
  console.log('Express server listening on port %d, in %s mode', config.port, app.get('env'));
});

// Expose app
module.exports = app;
