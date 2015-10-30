/*
 * (C) Copyright 2015, Siemens AG
 * Author: Marcos J. S. Rocha
 *
 * SPDX-License-Identifier:     BSD-2-Clause
 */
/**
 * Broadcast updates to client when the model changes
 */
'use strict';

var socketIo;

exports.registerSocketIo = function(s) {
  socketIo = s;
};

exports.onDeviceChange = function(device) {
  var notif = 'device:save';
  //console.log('socketIo.emit("' + notif + '")');
  socketIo.emit(notif, device ? device : {});
};

exports.onDeviceDelete = function(device) {
  var notif = 'device:remove';
  //console.log('socketIo.emit("' + notif + '")');
  socketIo.emit(notif, {id: device.id});
};
