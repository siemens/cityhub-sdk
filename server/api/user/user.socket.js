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

exports.onUserChange = function(user) {
  var notif = 'user:save';
  //console.log('socketIo.emit("' + notif + '")');
  socketIo.emit(notif, user ? user : {});
};

exports.onUserDelete = function(user) {
  var notif = 'user:remove';
  //console.log('socketIo.emit("' + notif + '")');
  socketIo.emit(notif, {id: user.id});
};
