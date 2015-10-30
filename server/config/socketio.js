/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
/**
 * Socket.io configuration
 */
'use strict';

var config = require('./environment');

// When the user disconnects.. perform this
function onDisconnect(socket) {
  if (!socket) {
    return;
  }
  //console.info('socket.io DISCONNECTED [%s:%d]', socket.request.connection.remoteAddress, socket.request.connection.remotePort);
}

// When the user connects perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function(data) {
    console.info('socket.io info [%s:%d] %s', socket.request.connection.remoteAddress, socket.request.connection.remotePort, JSON.stringify(data, null, 2));
  });
}

module.exports = function(socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));

  // pass socketIo object to model handlers
  require('../api/device/device.socket').registerSocketIo(socketio);
  require('../api/user/user.socket').registerSocketIo(socketio);

  socketio.on('connection', function(socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;
    socket.connectedAt = new Date();

    // Call-back onDisconnect.
    socket.on('disconnect', function() {
      onDisconnect(socket);
      console.info('socket.io DISCONNECTED [%s:%d %s]', socket.request.connection.remoteAddress, socket.request.connection.remotePort, socket.id);
    });

    // Call onConnect.
    onConnect(socket);
    console.info('socket.io CONNECTED [%s:%d %s]', socket.request.connection.remoteAddress, socket.request.connection.remotePort, socket.id);
  });
};
